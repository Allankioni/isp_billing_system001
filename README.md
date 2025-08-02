# WiFi Voucher Billing System

This is a comprehensive ISP billing system built with Next.js, designed to manage WiFi vouchers, payments, and users. It features a robust backend with API endpoints for handling authentication, administrative tasks, and payment processing, along with a user-friendly frontend for both customers and administrators.

## Features

-   **Voucher Management:** Generate, validate, and track WiFi vouchers.
-   **Payment Processing:** Integrated with M-Pesa for seamless payment handling.
-   **User Authentication:** Secure login for administrators and users.
-   **Admin Dashboard:** A powerful interface for managing users, plans, sessions, and viewing system statistics.
-   **Plan Management:** Create, update, and delete various data and time-based plans.
-   **Session Tracking:** Monitor active user sessions and their data usage.
-   **API-driven Architecture:** A clean and well-structured set of API endpoints for all functionalities.

## Technologies Used

-   **Frontend:** Next.js, React, jQuery
-   **Backend:** Node.js, Express.js (within Next.js API routes)
-   **Database:** MongoDB with Mongoose
-   **Authentication:** JSON Web Tokens (JWT)
-   **Styling:** CSS Modules, AdminLTE-like theme

## Getting Started

### Prerequisites

-   Node.js (v14 or later)
-   MongoDB
-   An M-Pesa account for payment integration (optional, for testing)

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Navigate to the project directory:
    ```bash
    cd isp_billing_system001
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the Application

1.  Create a `.env` file in the root of the `wifi-voucher-nextjs` directory and add the following environment variables:

    ```
    MONGO_URI=<your_mongodb_connection_string>
    JWT_SECRET=<your_jwt_secret_key>
    ```

2.  Run the development server:
    ```bash
    npm run dev
    ```

3.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the landing page.
4.  The admin dashboard is available at [http://localhost:3000/admin](http://localhost:3000/admin).

## API Endpoints

### Authentication

-   `POST /api/auth`: Login for administrators.

### Admin

-   `GET /api/admin/dashboard`: Get dashboard statistics.
-   `GET /api/admin/users`: Get a list of users.
-   `POST /api/admin/users`: Create a new user.
-   `PUT /api/admin/users/:id`: Update a user.
-   `DELETE /api/admin/users/:id`: Delete a user.
-   `GET /api/admin/plans`: Get a list of plans.
-   `POST /api/admin/plans`: Create a new plan.
-   `PUT /api/admin/plans/:id`: Update a plan.
-   `DELETE /api/admin/plans/:id`: Delete a plan.
-   `GET /api/admin/sessions`: Get a list of active sessions.
-   `POST /api/admin/initialize`: Initialize the system with default plans and an admin user.

### Vouchers

-   `GET /api/vouchers`: Get a list of all vouchers.
-   `POST /api/vouchers`: Validate a voucher for login.
-   `POST /api/vouchers/generate`: Generate a new voucher.
-   `GET /api/vouchers/:id`: Get a specific voucher by ID.
-   `DELETE /api/vouchers/:id`: Delete a voucher.

### Payments

-   `GET /api/payments`: Get a list of all payments.
-   `POST /api/payments/mpesa-callback`: Callback endpoint for M-Pesa payments.
-   `GET /api/payments/status/:paymentId`: Check the status of a payment.

## Project Structure

```
.
├── models/
│   ├── Payment.js
│   ├── Plan.js
│   ├── Session.js
│   ├── User.js
│   └── Voucher.js
├── pages/
│   ├── admin/
│   │   └── index.js
│   ├── api/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── payments/
│   │   └── vouchers/
│   └── landing/
│       └── index.js
├── public/
│   ├── admin-app.js
│   └── admin-styles.css
├── src/
│   └── app/
├── styles/
│   ├── Admin.module.css
│   └── Landing.module.css
└── utils/
    ├── auth.js
    └── db.js
```

## Environment Variables

-   `MONGO_URI`: The connection string for your MongoDB database.
-   `JWT_SECRET`: A secret key for signing JSON Web Tokens.
