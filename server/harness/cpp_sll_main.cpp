// Main cho project Singly Linked List: dựng danh sách từ tham số, gọi phương thức của sinh viên rồi ghi
// kết quả (danh sách đi từ list.head) ra file trace. Runner thay dòng đánh dấu DSA_CALL bằng lời gọi,
// vd. `list.insertAtPosition(position, target);`. Các step do gdb ghi (cpp_vars.py, chế độ 'lines').
// argv: <trace_path> <output_path> <target> <position> <giá trị các node...>
#include <cstdint>
#include <cstdio>
#include <cstdlib>

#include "SLL.h"

int main(int argc, char **argv) {
  std::FILE *trace = std::fopen(argv[1], "w");
  // Output của sinh viên ghi ra file riêng (stdout có thể lẫn thông báo của gdb);
  // không đệm để vẫn giữ được phần đã in nếu chương trình crash.
  std::freopen(argv[2], "w", stdout);
  std::setvbuf(stdout, nullptr, _IONBF, 0);
  int target = std::atoi(argv[3]);
  int position = std::atoi(argv[4]);

  SLL list;
  Node *tail = nullptr;
  for (int i = 5; i < argc; i++) {
    Node *node = new Node(std::atoi(argv[i]));
    if (tail == nullptr) list.head = node;
    else tail->next = node;
    tail = node;
  }

  /*DSA_CALL*/

  // Giá trị các node từ head (tối đa 100 node, phòng trường hợp danh sách bị vòng).
  std::fputs("{\"t\":\"done\",\"final\":[", trace);
  int count = 0;
  for (Node *node = list.head; node != nullptr && count < 100; node = node->next, count++) {
    std::fprintf(trace, count ? ",%d" : "%d", node->val);
  }
  std::fprintf(trace, "],\"result\":null,\"resultNode\":\"%llu\"}\n",
               (unsigned long long)(std::uintptr_t)list.head);
  std::fclose(trace);
  return 0;
}
