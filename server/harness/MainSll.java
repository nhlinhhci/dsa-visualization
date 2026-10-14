// Main cho project Singly Linked List (được ghi ra thành Main.java khi chạy). Runner thay dòng đánh dấu
// DSA_CALL bên dưới bằng lời gọi, vd. `list.insertAtPosition(position, target);`.
public class Main {
  // Không dùng mảng, nhưng Tracer luôn đọc field này.
  static int[] data = new int[0];
  // Tracer đọc kết quả từ list.head sau khi phương thức chạy xong.
  static SLL list;

  // args: <target> <position> <giá trị các node...>
  public static void main(String[] args) {
    int target = Integer.parseInt(args[0]);
    int position = Integer.parseInt(args[1]);
    list = new SLL();
    Node tail = null;
    for (int i = 2; i < args.length; i++) {
      Node node = new Node(Integer.parseInt(args[i]));
      if (tail == null) list.head = node;
      else tail.next = node;
      tail = node;
    }
    /*DSA_CALL*/
  }
}
