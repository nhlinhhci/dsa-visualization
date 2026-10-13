// Runtime ghi trace cho code C++ của sinh viên. File này được #include TRƯỚC code sinh viên;
// `vector`, `for`, `while` sau đó được định nghĩa lại bằng macro (xem cuối file).
// Nạp sẵn mọi header chuẩn: sau khi các macro bên dưới có hiệu lực thì không thể #include thêm.
#if __has_include(<bits/stdc++.h>)
#include <bits/stdc++.h>
#endif
#include <algorithm>
#include <climits>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <initializer_list>
#include <iostream>
#include <string>
#include <type_traits>
#include <utility>
#include <vector>

namespace __dsa {

inline FILE *&out() { static FILE *f = nullptr; return f; }
inline long long &maxSteps() { static long long v = 0; return v; }
inline long long &stepCount() { static long long v = 0; return v; }
inline int &curLine() { static int v = -1; return v; }
inline std::vector<int> &reads() { static std::vector<int> v; return v; }
inline std::vector<int> &writes() { static std::vector<int> v; return v; }
inline const std::vector<int> *&data() { static const std::vector<int> *p = nullptr; return p; }

inline void writeInts(const std::vector<int> &v) {
  std::fputc('[', out());
  for (size_t i = 0; i < v.size(); i++) std::fprintf(out(), i ? ",%d" : "%d", v[i]);
  std::fputc(']', out());
}

// Ghi step của dòng đang chạy (trạng thái mảng SAU khi dòng đó thực thi xong).
inline void flush() {
  if (curLine() < 0) return;
  std::fprintf(out(), "{\"t\":\"step\",\"line\":%d,\"array\":", curLine());
  writeInts(*data());
  std::fputs(",\"reads\":", out());
  writeInts(reads());
  std::fputs(",\"writes\":", out());
  writeInts(writes());
  std::fputs("}\n", out());
  std::fflush(out());
  reads().clear();
  writes().clear();
  curLine() = -1;
}

[[noreturn]] inline void fail(const char *kind, int line, const std::string &message) {
  flush();
  std::fprintf(out(), "{\"t\":\"error\",\"kind\":\"%s\",\"line\":%d,\"message\":\"%s\"}\n", kind, line,
               message.c_str());
  std::fflush(out());
  std::fflush(stdout);
  std::exit(0);
}

// `line` ở đây đã là chỉ số 0-based.
inline void begin(int line) {
  flush();
  if (++stepCount() > maxSteps()) fail("limit", line, "");
  curLine() = line;
}

inline bool loop(int line) {
  begin(line - 1);
  return true;
}

inline void access(int line, size_t index, bool write) {
  if (curLine() != line - 1) begin(line - 1);
  std::vector<int> &bucket = write ? writes() : reads();
  if (std::find(bucket.begin(), bucket.end(), (int)index) == bucket.end()) bucket.push_back((int)index);
}

// Chỉ số mảng kèm số dòng nơi nó được dùng: __builtin_LINE() trong tham số mặc định
// trả về dòng của biểu thức `arr[i]` trong code sinh viên.
struct Idx {
  long long i;
  int line;
  template <class T, class = typename std::enable_if<std::is_integral<T>::value>::type>
  Idx(T v, int l = __builtin_LINE()) : i((long long)v), line(l) {}
};

template <class T> class Vec;

template <class T> class Ref {
  Vec<T> *v;
  size_t i;
  int line;

public:
  Ref(Vec<T> *v, size_t i, int line) : v(v), i(i), line(line) {}
  Ref(const Ref &) = default;
  operator T() const {
    if (v->traced) access(line, i, false);
    return v->d[i];
  }
  Ref &operator=(const T &value) {
    // access() có thể ghi step của dòng trước, nên phải gọi trước khi mảng thay đổi.
    if (v->traced) access(line, i, true);
    v->d[i] = value;
    return *this;
  }
  Ref &operator=(const Ref &other) { return *this = (T)other; }
  Ref &operator+=(const T &x) { return *this = (T)(*this) + x; }
  Ref &operator-=(const T &x) { return *this = (T)(*this) - x; }
  Ref &operator*=(const T &x) { return *this = (T)(*this) * x; }
  Ref &operator/=(const T &x) { return *this = (T)(*this) / x; }
  Ref &operator++() { return *this += 1; }
  Ref &operator--() { return *this -= 1; }
  T operator++(int) { T old = *this; *this = old + 1; return old; }
  T operator--(int) { T old = *this; *this = old - 1; return old; }
};

template <class T> void swap(Ref<T> a, Ref<T> b) {
  T x = a;
  T y = b;
  a = y;
  b = x;
}

template <class T> class Vec {
public:
  std::vector<T> d;
  bool traced = false;

  Vec() {}
  explicit Vec(size_t n) : d(n) {}
  Vec(size_t n, const T &value) : d(n, value) {}
  Vec(std::initializer_list<T> init) : d(init) {}
  // Bản sao là một mảng khác, không phải mảng đang được trực quan hóa.
  Vec(const Vec &other) : d(other.d) {}
  Vec &operator=(const Vec &other) {
    d = other.d;
    return *this;
  }

  size_t size() const { return d.size(); }
  bool empty() const { return d.empty(); }
  void push_back(const T &value) { d.push_back(value); }
  void pop_back() { d.pop_back(); }
  void resize(size_t n) { d.resize(n); }
  void clear() { d.clear(); }

  Ref<T> operator[](Idx index) { return at(index); }
  Ref<T> at(Idx index) {
    if (index.i < 0 || index.i >= (long long)d.size())
      fail("runtime", index.line - 1,
           "Index out of range: " + std::to_string(index.i) + " (size " + std::to_string(d.size()) + ")");
    return Ref<T>(this, (size_t)index.i, index.line);
  }
  Ref<T> front(int line = __builtin_LINE()) { return at(Idx(0, line)); }
  Ref<T> back(int line = __builtin_LINE()) { return at(Idx((long long)d.size() - 1, line)); }

  typename std::vector<T>::iterator begin() { return d.begin(); }
  typename std::vector<T>::iterator end() { return d.end(); }
};

} // namespace __dsa

template <class T> using __dsa_Vec = __dsa::Vec<T>;
namespace std {
// using-declaration (không khai báo alias mới) để `using namespace std;` không gây nhập nhằng.
using ::__dsa_Vec;
using ::__dsa::swap;
} // namespace std

#define vector __dsa_Vec
#define for(...) for (__VA_ARGS__) if (!__dsa::loop(__LINE__)) {} else
#define while(...) while (__dsa::loop(__LINE__) && (__VA_ARGS__))
