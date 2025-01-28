# Creating a New Project

We recommend using `pnpm` as your package manager, as it's faster and more efficient than `npm` or `yarn`. If you don't have `pnpm` installed, you can install it globally by running:

```sh
npm install -g pnpm
```
To create a Next.js app, open your terminal, cd into the folder you'd like to keep your project, and run the following command:

```sh
npx create-next-app@latest nextjs-dashboard --example "https://github.com/vercel/next-learn/tree/main/dashboard/starter-example" --use-pnpm
```

This command uses create-next-app, a Command Line Interface (CLI) tool that sets up a Next.js application for you. In the command above, you're also using the **--example** flag with the starter example for this course.

Exploring the Project

# Project Structure

## /app
- Contains all the routes, components, and logic for your application, this is where you'll be mostly working from.

## /app/lib
- Contains functions used in your application, such as reusable utility functions and data fetching functions.

## /app/ui
- Contains all the UI components for your application, such as cards, tables, and forms. To save time, we've pre-styled these components for you.

## /public
- Contains all the static assets for your application, such as images.

## Config Files
- You'll also notice config files such as `next.config.ts` at the root of your application. Most of these files are created and pre-configured when you start a new project using `create-next-app`. You will not need to modify them in this course.