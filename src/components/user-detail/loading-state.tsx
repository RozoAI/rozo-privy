import { CardDescription, CardHeader, CardTitle } from "../ui/card";

export function LoadingState() {
  return (
    <CardHeader>
      <CardTitle>Loading</CardTitle>
      <CardDescription>Loading user details. Please wait...</CardDescription>
    </CardHeader>
  );
}
