import dynamic from "next/dynamic";

const SignIn = dynamic(() =>
  import("@repo/auth/components/sign-in").then((mod) => mod.SignIn)
);

const SignInView = () => (
  <div className="flex min-h-screen items-center justify-center">
    <SignIn />
  </div>
);

export default SignInView;