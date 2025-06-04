// User model class
export class UserModel {
  constructor(data) {
    this.id = data.id || '';
    this.username = data.username || '';
    this.name = data.name || '';
    this.email = data.email || '';
    this.role = data.role || '';
    this.token = data.token || '';
    // Add other user properties as needed
  }
}

// Parse JSON response to user model
export function userModelFromJson(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    return new UserModel(data);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}
