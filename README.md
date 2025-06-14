# ScreenTime Booking - Next.js Application

This is a Next.js application for booking video screens, featuring an admin panel and AI-powered recommendations using Genkit.

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js**: Version 18.x or 20.x recommended.
*   **npm** (comes with Node.js) or **yarn**.
*   **PostgreSQL**: A running PostgreSQL database server.
*   **Git**

## Getting Started Locally

Follow these steps to get the application running on your local machine:

### 1. Clone the Repository (if you haven't already)

```bash
# If you're in Firebase Studio, you likely already have the code.
# Otherwise, clone it:
# git clone <repository_url>
# cd <repository_name>
```

### 2. Install Dependencies

Install the project dependencies using npm or yarn:

```bash
npm install
# or
# yarn install
```

### 3. Set Up Environment Variables

The application uses environment variables for configuration, especially for database connection, admin credentials, and API keys.

*   Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
*   Open the newly created `.env` file and update the variables:
    *   `DATABASE_URL`: Set this to your PostgreSQL connection string.
        *   Example: `postgresql://user:password@localhost:5432/mydatabase?schema=public`
        *   Ensure the user has privileges to create and modify tables in the specified database and schema.
    *   `INITIAL_ADMIN_USERNAME`: The username for the initial admin account (default is `admin`).
    *   `INITIAL_ADMIN_PASSWORD_HASH`: (Optional) If you want to set a custom password for the initial admin user, generate a bcrypt hash for your desired password and put it here. If left empty or commented out, the seed script will use a default hash for the password "adminpassword".
        *   **Security Note**: For any non-local/testing deployment, always use a strong, unique password and its hash.
    *   `ADMIN_SESSION_TOKEN_VALUE`: A **strong, random string** used to secure admin sessions. Generate one using a tool like `openssl rand -base64 32`.
    *   `GOOGLE_API_KEY`: Your API key from Google AI Studio for enabling Genkit AI features. Get it from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 4. Set Up the Database

This project uses Prisma as its ORM.

*   **Apply database migrations**: This will create the necessary tables in your PostgreSQL database based on the schema defined in `prisma/schema.prisma`.
    ```bash
    npm run prisma:migrate
    ```
    When prompted, you can enter a name for the migration (e.g., `init`).

*   **Seed the database**: This will populate the database with initial data, such as screen information and the admin user (using credentials from `.env`).
    ```bash
    npm run prisma:seed
    ```

### 5. Running the Application

The application consists of two main parts: the Next.js frontend/backend and the Genkit AI development server. You'll need to run them in separate terminal windows.

*   **Terminal 1: Start the Genkit Development Server**
    This server handles AI flow executions and provides the Genkit Inspector.
    ```bash
    npm run genkit:dev
    ```
    The Genkit Inspector will typically be available at `http://localhost:4000`.

*   **Terminal 2: Start the Next.js Development Server**
    This server runs the main application.
    ```bash
    npm run dev
    ```
    The Next.js application will typically be available at `http://localhost:3000`.

### 6. Accessing the Application

*   **Main Application**: Open your browser and navigate to `http://localhost:3000`.
*   **Admin Panel**: Navigate to `http://localhost:3000/admin`.
    *   Log in using the `INITIAL_ADMIN_USERNAME` and the corresponding password ("adminpassword" if `INITIAL_ADMIN_PASSWORD_HASH` was not set, or your custom password).
*   **Genkit Inspector**: Navigate to `http://localhost:4000` to view Genkit flows, traces, and other development information.

## Available Scripts

*   `npm run dev`: Starts the Next.js development server with Turbopack.
*   `npm run genkit:dev`: Starts the Genkit development server.
*   `npm run genkit:watch`: Starts the Genkit development server with watch mode.
*   `npm run build`: Builds the Next.js application for production (includes `prisma generate`).
*   `npm run start`: Starts the Next.js production server (after running `npm run build`).
*   `npm run lint`: Lints the codebase.
*   `npm run typecheck`: Runs TypeScript type checking.
*   `npm run prisma:migrate`: Applies Prisma database migrations.
*   `npm run prisma:seed`: Seeds the database with initial data.
*   `npm run prisma:studio`: Opens Prisma Studio to view and manage your database.

## Project Structure Overview

*   `src/app/`: Next.js App Router pages and layouts.
    *   `src/app/admin/`: Admin panel specific routes and components.
    *   `src/app/confirmation/`: Booking confirmation page.
*   `src/components/`: React components.
    *   `src/components/ui/`: ShadCN UI components.
    *   `src/components/admin/`: Components specific to the admin panel.
*   `src/ai/`: Genkit related files.
    *   `src/ai/flows/`: Genkit flow definitions.
*   `src/lib/`: Shared libraries, actions, types, and utilities.
    *   `src/lib/actions.ts`: Server Actions for database operations and authentication.
    *   `src/lib/prisma.ts`: Prisma client initialization.
    *   `src/lib/types.ts`: TypeScript type definitions.
*   `prisma/`: Prisma schema, migrations, and seed script.
*   `public/`: Static assets.

## Technology Stack

*   Next.js (with App Router & Turbopack)
*   React
*   TypeScript
*   Tailwind CSS
*   ShadCN UI
*   Prisma (ORM for PostgreSQL)
*   Genkit (for AI features, with Google AI)
*   bcrypt.js (for password hashing)

---

Happy coding!
