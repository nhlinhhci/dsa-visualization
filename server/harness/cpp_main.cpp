#undef vector
#undef for
#undef while

// DSA_CALL(arr, n, target) do runner định nghĩa: lời gọi hàm của sinh viên, có giá trị kiểu int
// (index tìm được với thuật toán tìm kiếm, 0 với thuật toán sắp xếp).
// argv: <trace_path> <max_steps> <target> <giá trị mảng...>
int main(int argc, char **argv) {
  __dsa::out() = std::fopen(argv[1], "w");
  __dsa::maxSteps() = std::atoll(argv[2]);
  int target = std::atoi(argv[3]);
  __dsa::Vec<int> arr;
  for (int i = 4; i < argc; i++) arr.d.push_back(std::atoi(argv[i]));
  arr.traced = true;
  __dsa::data() = &arr.d;

  int result = DSA_CALL(arr, (int)arr.d.size(), target);

  __dsa::flush();
  std::fputs("{\"t\":\"done\",\"final\":", __dsa::out());
  __dsa::writeInts(arr.d);
  std::fprintf(__dsa::out(), ",\"result\":%d}\n", result);
  std::fclose(__dsa::out());
  return 0;
}
