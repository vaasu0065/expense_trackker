import 'package:intl/intl.dart';

final _inr0 = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
final _inr2 = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);

/// ₹ amount with Indian digit grouping, matching the web app (`toLocaleString("en-IN")`).
/// Whole numbers drop the paise; fractional amounts keep two decimals.
String formatInr(num amount) {
  final abs = amount.abs();
  final whole = abs == abs.roundToDouble();
  return (whole ? _inr0 : _inr2).format(abs);
}

/// Signed amount: U+2212 minus for money out, + for money in.
String formatSignedInr(num amount, {required bool isCredit}) =>
    '${isCredit ? '+' : '−'}${formatInr(amount)}';

String formatTxnDate(DateTime d, {bool hasTime = true}) {
  final now = DateTime.now();
  final datePart = d.year == now.year ? DateFormat('d MMM').format(d) : DateFormat('d MMM yyyy').format(d);
  return hasTime ? '$datePart, ${DateFormat('h:mm a').format(d)}' : datePart;
}
