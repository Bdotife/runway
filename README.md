# Runway website

A static site: one `index.html` (website, sign-up, sign-in and the app), a favicon and a Vercel config. No build step.

## Deploy with the Vercel CLI

```bash
cd runway-site
npx vercel          # first time: log in, accept the defaults
npx vercel --prod   # publish to your production URL
```

## Deploy from GitHub

1. Push this folder to a new GitHub repository.
2. In Vercel, choose **Add New → Project**, import the repository.
3. Framework preset: **Other**. Leave build command and output directory empty.
4. Deploy.

## Direct links

- `/#signup` opens sign-up
- `/#signin` opens sign-in

## Notes

- Accounts and budgets are stored in the visitor's browser (localStorage). There is no server yet.
- Voice input works on HTTPS in browsers that support speech recognition (Chrome, Edge, Safari).
