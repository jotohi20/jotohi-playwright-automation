export type SignupUser = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  company: string;
};

export function randomSignupUser(): SignupUser {
  const id = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

  return {
    firstName: "Test",
    lastName: `User${id}`,
    email: `test.user.${id}@example.com`,
    username: `test.user.${id}@example.com`,
    company: `TestCompany${id}`,
  };
}
