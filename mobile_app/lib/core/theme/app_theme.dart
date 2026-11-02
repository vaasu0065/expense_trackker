import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Semantic colours that Material's [ColorScheme] has no slot for
/// (money in / money out / warning, muted text, hairlines, chart palette).
/// Read them with `context.appColors`.
@immutable
class AppColors extends ThemeExtension<AppColors> {
  final Color income; // text / icons for money in
  final Color incomeFill; // bars, progress, tinted backgrounds
  final Color expense; // text / icons for money out
  final Color expenseFill;
  final Color warning;
  final Color brandText; // indigo used as text/icon on the page background
  final Color muted; // secondary text (>= 4.5:1)
  final Color faint; // placeholders, hints only
  final Color border; // card + divider hairline
  final Color raised; // inputs / areas inside cards
  final List<Color> chart; // categorical palette

  const AppColors({
    required this.income,
    required this.incomeFill,
    required this.expense,
    required this.expenseFill,
    required this.warning,
    required this.brandText,
    required this.muted,
    required this.faint,
    required this.border,
    required this.raised,
    required this.chart,
  });

  static const dark = AppColors(
    income: Color(0xFF34D399),
    incomeFill: Color(0xFF10B981),
    expense: Color(0xFFFB7185),
    expenseFill: Color(0xFFF43F5E),
    warning: Color(0xFFFBBF24),
    brandText: Color(0xFF818CF8),
    muted: Color(0xFF94A3B8),
    faint: Color(0xFF64748B),
    border: Color(0x14FFFFFF), // white @ 8%
    raised: Color(0xFF101A2E),
    chart: [
      Color(0xFF818CF8),
      Color(0xFF34D399),
      Color(0xFFFBBF24),
      Color(0xFFFB7185),
      Color(0xFF38BDF8),
      Color(0xFFC084FC),
      Color(0xFFF472B6),
      Color(0xFFA3E635),
    ],
  );

  // Light variants are one or two steps darker so text keeps >= 4.5:1 on white.
  static const light = AppColors(
    income: Color(0xFF047857),
    incomeFill: Color(0xFF10B981),
    expense: Color(0xFFE11D48),
    expenseFill: Color(0xFFF43F5E),
    warning: Color(0xFFB45309),
    brandText: Color(0xFF4F46E5),
    muted: Color(0xFF475569),
    faint: Color(0xFF64748B),
    border: Color(0xFFE2E8F0),
    raised: Color(0xFFF1F5F9),
    chart: [
      Color(0xFF6366F1),
      Color(0xFF10B981),
      Color(0xFFF59E0B),
      Color(0xFFF43F5E),
      Color(0xFF0EA5E9),
      Color(0xFFA855F7),
      Color(0xFFEC4899),
      Color(0xFF84CC16),
    ],
  );

  @override
  AppColors copyWith() => this;

  @override
  AppColors lerp(ThemeExtension<AppColors>? other, double t) =>
      (other is AppColors && t >= 0.5) ? other : this;
}

extension AppThemeContext on BuildContext {
  AppColors get appColors => Theme.of(this).extension<AppColors>() ?? AppColors.dark;
  ColorScheme get colors => Theme.of(this).colorScheme;
  TextTheme get text => Theme.of(this).textTheme;
}

class AppTheme {
  // Brand + semantic tokens (design-system/MASTER.md)
  static const Color primary = Color(0xFF6366F1);
  static const Color primaryAccent = Color(0xFF818CF8);
  static const Color emerald = Color(0xFF10B981);
  static const Color rose = Color(0xFFF43F5E);
  static const Color amber = Color(0xFFF59E0B);

  // Dark surfaces
  static const Color ink950 = Color(0xFF020617);
  static const Color ink900 = Color(0xFF0B1222);
  static const Color ink850 = Color(0xFF101A2E);
  static const Color ink800 = Color(0xFF16223A);
  static const Color ink700 = Color(0xFF22304D);

  // Light surfaces
  static const Color slate50 = Color(0xFFF8FAFC);
  static const Color slate100 = Color(0xFFF1F5F9);
  static const Color slate200 = Color(0xFFE2E8F0);
  static const Color slate300 = Color(0xFFCBD5E1);
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color slate600 = Color(0xFF475569);
  static const Color slate900 = Color(0xFF0F172A);
  static const Color textLight = Color(0xFFF8FAFC);

  static const double radiusCard = 16;
  static const double radiusControl = 12;

  /// Tabular, semibold figures for every amount.
  static const List<FontFeature> tabular = [FontFeature.tabularFigures()];

  static ThemeData get darkTheme => _build(
        brightness: Brightness.dark,
        scheme: const ColorScheme.dark(
          primary: primary,
          onPrimary: Colors.white,
          primaryContainer: Color(0xFF312E81),
          onPrimaryContainer: Color(0xFFE0E7FF),
          secondary: primaryAccent,
          onSecondary: ink950,
          surface: ink900,
          onSurface: textLight,
          onSurfaceVariant: slate400,
          surfaceContainerLowest: ink950,
          surfaceContainerLow: ink900,
          surfaceContainer: ink900,
          surfaceContainerHigh: ink850,
          surfaceContainerHighest: ink800,
          outline: ink700,
          outlineVariant: Color(0x14FFFFFF),
          error: Color(0xFFFB7185),
          onError: ink950,
          inverseSurface: slate100,
          onInverseSurface: slate900,
        ),
        background: ink950,
        ext: AppColors.dark,
      );

  static ThemeData get lightTheme => _build(
        brightness: Brightness.light,
        scheme: const ColorScheme.light(
          primary: primary,
          onPrimary: Colors.white,
          primaryContainer: Color(0xFFE0E7FF),
          onPrimaryContainer: Color(0xFF312E81),
          secondary: Color(0xFF4F46E5),
          onSecondary: Colors.white,
          surface: Colors.white,
          onSurface: slate900,
          onSurfaceVariant: slate600,
          surfaceContainerLowest: Colors.white,
          surfaceContainerLow: slate50,
          surfaceContainer: Colors.white,
          surfaceContainerHigh: slate100,
          surfaceContainerHighest: slate200,
          outline: slate300,
          outlineVariant: slate200,
          error: Color(0xFFE11D48),
          onError: Colors.white,
          inverseSurface: slate900,
          onInverseSurface: slate50,
        ),
        background: slate50,
        ext: AppColors.light,
      );

  static ThemeData _build({
    required Brightness brightness,
    required ColorScheme scheme,
    required Color background,
    required AppColors ext,
  }) {
    final isDark = brightness == Brightness.dark;
    final base = ThemeData(useMaterial3: true, brightness: brightness, colorScheme: scheme);
    final textTheme = GoogleFonts.ibmPlexSansTextTheme(base.textTheme)
        .apply(bodyColor: scheme.onSurface, displayColor: scheme.onSurface)
        .copyWith(
          headlineSmall: GoogleFonts.ibmPlexSans(fontSize: 24, fontWeight: FontWeight.w600, color: scheme.onSurface),
          titleLarge: GoogleFonts.ibmPlexSans(fontSize: 20, fontWeight: FontWeight.w600, color: scheme.onSurface),
          titleMedium: GoogleFonts.ibmPlexSans(fontSize: 16, fontWeight: FontWeight.w600, color: scheme.onSurface),
          titleSmall: GoogleFonts.ibmPlexSans(fontSize: 14, fontWeight: FontWeight.w600, color: scheme.onSurface),
          bodyLarge: GoogleFonts.ibmPlexSans(fontSize: 15, fontWeight: FontWeight.w500, color: scheme.onSurface),
          bodyMedium: GoogleFonts.ibmPlexSans(fontSize: 14, color: scheme.onSurface),
          bodySmall: GoogleFonts.ibmPlexSans(fontSize: 13, color: ext.muted),
          labelLarge: GoogleFonts.ibmPlexSans(fontSize: 14, fontWeight: FontWeight.w600),
          labelMedium: GoogleFonts.ibmPlexSans(fontSize: 12, fontWeight: FontWeight.w500, color: ext.muted),
          labelSmall: GoogleFonts.ibmPlexSans(fontSize: 12, fontWeight: FontWeight.w500, color: ext.muted),
        );

    final controlShape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusControl));
    final buttonText = GoogleFonts.ibmPlexSans(fontSize: 15, fontWeight: FontWeight.w600);
    const buttonSize = Size(64, 48);
    final cardShape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(radiusCard),
      side: BorderSide(color: ext.border),
    );
    final inputBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(radiusControl),
      borderSide: BorderSide(color: isDark ? ext.border : slate200),
    );

    return base.copyWith(
      scaffoldBackgroundColor: background,
      canvasColor: background,
      textTheme: textTheme,
      primaryTextTheme: textTheme,
      extensions: [ext],
      splashFactory: InkRipple.splashFactory,
      cardTheme: CardThemeData(
        color: scheme.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: cardShape,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: background,
        surfaceTintColor: Colors.transparent,
        foregroundColor: scheme.onSurface,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleSpacing: 16,
        titleTextStyle: GoogleFonts.ibmPlexSans(fontSize: 22, fontWeight: FontWeight.w600, color: scheme.onSurface),
        iconTheme: IconThemeData(color: scheme.onSurface, size: 22),
        actionsIconTheme: IconThemeData(color: scheme.onSurface, size: 22),
      ),
      iconTheme: IconThemeData(color: scheme.onSurface, size: 20),
      dividerTheme: DividerThemeData(color: ext.border, thickness: 1, space: 1),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark ? ink850 : Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        labelStyle: GoogleFonts.ibmPlexSans(fontSize: 14, color: ext.muted),
        floatingLabelStyle: GoogleFonts.ibmPlexSans(fontSize: 14, color: ext.brandText, fontWeight: FontWeight.w500),
        hintStyle: GoogleFonts.ibmPlexSans(fontSize: 14, color: ext.faint),
        helperStyle: GoogleFonts.ibmPlexSans(fontSize: 12, color: ext.muted),
        errorStyle: GoogleFonts.ibmPlexSans(fontSize: 12, color: scheme.error),
        prefixIconColor: ext.muted,
        suffixIconColor: ext.muted,
        border: inputBorder,
        enabledBorder: inputBorder,
        focusedBorder: inputBorder.copyWith(borderSide: BorderSide(color: ext.brandText, width: 2)),
        errorBorder: inputBorder.copyWith(borderSide: BorderSide(color: scheme.error)),
        focusedErrorBorder: inputBorder.copyWith(borderSide: BorderSide(color: scheme.error, width: 2)),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          disabledBackgroundColor: primary.withValues(alpha: 0.5),
          disabledForegroundColor: Colors.white.withValues(alpha: 0.8),
          minimumSize: buttonSize,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          shape: controlShape,
          textStyle: buttonText,
          elevation: 0,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          minimumSize: buttonSize,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          shape: controlShape,
          textStyle: buttonText,
          elevation: 0,
          shadowColor: Colors.transparent,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: scheme.onSurface,
          minimumSize: buttonSize,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          shape: controlShape,
          side: BorderSide(color: isDark ? ink700 : slate300),
          textStyle: buttonText,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: ext.brandText,
          minimumSize: const Size(48, 48),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          shape: controlShape,
          textStyle: GoogleFonts.ibmPlexSans(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(minimumSize: const Size(48, 48), foregroundColor: scheme.onSurface),
      ),
      segmentedButtonTheme: SegmentedButtonThemeData(
        style: SegmentedButton.styleFrom(
          minimumSize: const Size(0, 48),
          textStyle: GoogleFonts.ibmPlexSans(fontSize: 14, fontWeight: FontWeight.w600),
          side: BorderSide(color: isDark ? ink700 : slate300),
          shape: controlShape,
          backgroundColor: isDark ? ink850 : Colors.white,
          foregroundColor: ext.muted,
          selectedBackgroundColor: isDark ? ink700 : slate200,
          selectedForegroundColor: scheme.onSurface,
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: scheme.surface,
        selectedColor: primary,
        disabledColor: scheme.surface,
        side: BorderSide(color: isDark ? ink700 : slate200),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        labelStyle: GoogleFonts.ibmPlexSans(fontSize: 13, fontWeight: FontWeight.w500, color: scheme.onSurface),
        secondaryLabelStyle: GoogleFonts.ibmPlexSans(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
        showCheckmark: false,
        elevation: 0,
        pressElevation: 0,
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 68,
        elevation: 0,
        backgroundColor: isDark ? ink900 : Colors.white,
        surfaceTintColor: Colors.transparent,
        indicatorColor: primary.withValues(alpha: isDark ? 0.22 : 0.12),
        indicatorShape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusControl)),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        iconTheme: WidgetStateProperty.resolveWith((states) => IconThemeData(
              size: 22,
              color: states.contains(WidgetState.selected) ? ext.brandText : ext.muted,
            )),
        labelTextStyle: WidgetStateProperty.resolveWith((states) => GoogleFonts.ibmPlexSans(
              fontSize: 12,
              fontWeight: states.contains(WidgetState.selected) ? FontWeight.w600 : FontWeight.w500,
              color: states.contains(WidgetState.selected) ? scheme.onSurface : ext.muted,
            )),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: isDark ? ink900 : Colors.white,
        surfaceTintColor: Colors.transparent,
        modalBackgroundColor: isDark ? ink900 : Colors.white,
        elevation: 0,
        modalElevation: 0,
        showDragHandle: true,
        dragHandleColor: isDark ? ink700 : slate300,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: isDark ? ink900 : Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: cardShape,
        titleTextStyle: GoogleFonts.ibmPlexSans(fontSize: 18, fontWeight: FontWeight.w600, color: scheme.onSurface),
        contentTextStyle: GoogleFonts.ibmPlexSans(fontSize: 14, color: ext.muted),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: isDark ? ink800 : slate900,
        contentTextStyle: GoogleFonts.ibmPlexSans(fontSize: 14, color: textLight),
        actionTextColor: primaryAccent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusControl),
          side: BorderSide(color: isDark ? ink700 : slate900),
        ),
      ),
      listTileTheme: ListTileThemeData(
        iconColor: ext.muted,
        minVerticalPadding: 12,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16),
        titleTextStyle: GoogleFonts.ibmPlexSans(fontSize: 15, fontWeight: FontWeight.w500, color: scheme.onSurface),
        subtitleTextStyle: GoogleFonts.ibmPlexSans(fontSize: 13, color: ext.muted),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
            (s) => s.contains(WidgetState.selected) ? Colors.white : (isDark ? slate400 : slate600)),
        trackColor: WidgetStateProperty.resolveWith(
            (s) => s.contains(WidgetState.selected) ? primary : (isDark ? ink850 : slate200)),
        trackOutlineColor: WidgetStateProperty.resolveWith(
            (s) => s.contains(WidgetState.selected) ? primary : (isDark ? ink700 : slate300)),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: primary,
        linearTrackColor: isDark ? ink800 : slate200,
        circularTrackColor: Colors.transparent,
      ),
      dropdownMenuTheme: DropdownMenuThemeData(
        textStyle: GoogleFonts.ibmPlexSans(fontSize: 15, color: scheme.onSurface),
      ),
    );
  }
}
