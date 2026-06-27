import dynamic from "next/dynamic";

const SignUp = dynamic(() =>
  import("@repo/auth/components/sign-up").then((mod) => mod.SignUp)
);
const SignUpView = () => (
  <div className="flex min-h-screen items-center justify-center">
    <SignUp />
  </div>
);

export default SignUpView;  
