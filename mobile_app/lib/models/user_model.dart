class UserSettings {
  final bool smsTrackingEnabled;
  final bool darkMode;
  final String currency;
  final double monthlyBudget;

  UserSettings({
    this.smsTrackingEnabled = true,
    this.darkMode = false,
    this.currency = 'INR',
    this.monthlyBudget = 50000.0,
  });

  factory UserSettings.fromJson(Map<String, dynamic> json) {
    return UserSettings(
      smsTrackingEnabled: json['smsTrackingEnabled'] ?? true,
      darkMode: json['darkMode'] ?? false,
      currency: json['currency'] ?? 'INR',
      monthlyBudget: (json['monthlyBudget'] ?? 50000).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'smsTrackingEnabled': smsTrackingEnabled,
      'darkMode': darkMode,
      'currency': currency,
      'monthlyBudget': monthlyBudget,
    };
  }
}

class UserModel {
  final String id;
  final String name;
  final String email;
  final UserSettings settings;
  final bool gmailSyncEnabled;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.settings,
    this.gmailSyncEnabled = false,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? json['_id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      settings: UserSettings.fromJson(json['settings'] ?? {}),
      gmailSyncEnabled: json['gmailSyncEnabled'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'settings': settings.toJson(),
      'gmailSyncEnabled': gmailSyncEnabled,
    };
  }
}
