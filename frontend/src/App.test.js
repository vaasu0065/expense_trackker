import { render, screen } from "@testing-library/react";
import Login from "./components/Login";

test("sign-in page shows the form", () => {
  render(<Login />);
  expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
});
