# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Supabase account management

The account management screen calls the `delete-account` Edge Function.
Before enabling account deletion for users, ensure the app's existing
`households`, `household_members`, `tasks`, `task_history`, `shopping_items`,
and `profiles` tables are present, then apply the migration and deploy the
function to the same Supabase project:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
supabase functions deploy delete-account
```

The function validates the caller's session, removes the user's profile and
household membership, preserves a household shared with other members, and
deletes household data only when the user was its last member. It then deletes
the Auth user using a server-side Supabase key. No server key is stored in the
mobile app.

The household collaboration migration adds one-time invitation codes that
expire after 7 days and an owner role. The creator owns new households;
existing households with one member assign that member as owner, while
existing multi-member households require a one-time owner selection in the
Domownicy screen. Only the owner can change task assignments, although every
member can view and complete tasks. If the owner leaves, ownership is
transferred to a remaining member.

Deploy the email invitation function after applying the household migration:

```bash
supabase functions deploy send-household-invite
```

Email invitations use Supabase Auth's invite email, so configure custom SMTP in
the project's Authentication settings and allow `ecomeansmobile://auth/callback`
as a redirect URL. The invite link joins the recipient to the household after
they confirm the invitation. This email flow is for new EcoMeans accounts; for
someone who already has an account, create and share a one-time invitation code.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
