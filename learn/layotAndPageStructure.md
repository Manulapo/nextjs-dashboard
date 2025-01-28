# Creating Separate UIs for Routes with `layout.tsx` and `page.tsx`

In Next.js, you can create separate UIs for each route using `layout.tsx` and `page.tsx` files.

The `page.tsx` file is a special Next.js file that exports a React component, and it's required for the route to be accessible. For example, in your application, you already have a `page.tsx` file: `/app/page.tsx`. This file represents the home page associated with the route `/`.

---

## Creating a Nested Route

To create a nested route, you can nest folders inside each other and add `page.tsx` files within them. For example:

**Diagram**: Adding a folder called `dashboard` creates a new route `/dashboard`.

`/app/dashboard/page.tsx` is associated with the `/dashboard` path. Let's create the page to see how it works!

---

<!-- add image -->



### Creating the Dashboard Page

1. Create a new folder called `dashboard` inside `/app`.
2. Create a new `page.tsx` file inside the `dashboard` folder with the following content:

```tsx
// /app/dashboard/page.tsx

export default function Page() {
  return <p>Dashboard Page</p>;
}
```

3. Make sure the development server is running and visit `http://localhost:3000/dashboard`. You should see the text:

**"Dashboard Page"**

---

## How Next.js Handles Routes

This is how you can create different pages in Next.js:

1. **Create a new route segment** by adding a folder.
2. **Add a `page.tsx` file** inside the folder.

By having a special name for page files, Next.js allows you to colocate UI components, test files, and other related code with your routes. Only the content inside the `page.tsx` file will be publicly accessible. 

For example:
- The `/ui` and `/lib` folders are colocated inside the `/app` folder along with your routes.
