export const AUTH_COPY = {
    back: 'Back to home',
    oauth: 'Continue with Google',
    comingSoon: 'Coming soon',
    divider: 'or',
    signIn: {
        title: 'Welcome back',
        subtitle: 'Sign in to manage your bookings',
        submit: 'Sign In',
        forgot: 'Forgot password?',
        switchPrompt: "Don't have an account?",
        switchAction: 'Sign up',
    },
    signUp: {
        title: 'Create your account',
        subtitle: 'Book your first pickup in under a minute',
        submit: 'Create Account',
        switchPrompt: 'Already have an account?',
        switchAction: 'Sign in',
    },
    forgotPassword: {
        title: 'Reset your password',
        subtitle: "Enter the email on your account and we'll send a reset link.",
        submit: 'Send reset link',
        sentTitle: 'Check your inbox',
        sentBody: 'If an account exists for {email}, a reset link is on its way.',
        sentNote: 'The link expires in 30 minutes.',
        backToSignIn: 'Back to sign in',
    },
    methods: [
        { value: 'email', label: 'Email', icon: 'mail' },
        { value: 'phone', label: 'Phone', icon: 'phone' },
    ],
    fields: {
        email: { label: 'Email', placeholder: 'you@example.com', autoComplete: 'email' },
        phone: { label: 'Phone Number', placeholder: '+91 98765 43210', autoComplete: 'tel' },
        fullName: { label: 'Full Name', placeholder: 'Ayush Agrawal', autoComplete: 'name' },
        password: { label: 'Password', placeholder: '••••••••' },
    },
    passwordToggle: { show: 'Show password', hide: 'Hide password' },
} as const;

export const SIGN_UP_FIELDS = [
    { name: 'fullName', type: 'text' },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'tel' },
] as const;
