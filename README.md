# Crystl: AI-Powered Financial Transparency Platform

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Google Cloud AI](https://img.shields.io/badge/Google_Cloud_AI-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/ai)
[![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

**Crystl is a full-stack MERN application developed for the "Bit N Build" hackathon to solve the critical challenge of financial opacity. It's a multi-tenant ecosystem designed to automate data ingestion, provide clarity through visualization, and foster public trust through a verifiable, two-party approval system.**

---

## 🚀 Live Demo & Links

| Live Application | Video Presentation |
| :---: | :---: |
| **[crystl.vercel.app](https://crystl.vercel.app/)** | **[Watch Video](https://drive.google.com/file/d/1WQvcB-11cOOVt3Plh-oaUhZMM1ctYdW5/view)** |
| *Click to explore the live, deployed project.* | *Click to watch our 3-minute demo video.* |

*Use the "Explore Institutions" button on the homepage to view public financial data without needing to log in.*

---

## ⭐️ My Contributions & Role

This project was a collaborative effort for the "Bit N Build" hackathon. This repository is a personal fork of the original team project, which can be found **[here](https://github.com/rajathnh/Crystl)**. The content below has been curated to highlight my specific contributions.

As a key full-stack developer, I was deeply involved in architecting and implementing features across the entire application, with a primary focus on the frontend user experience and backend integration.

#### Frontend Development:
*   **Application Architecture:** I built the foundational structure of the React application using Vite, establishing the routing system with `react-router-dom` and implementing global state management for authentication and currency conversion with the Context API.
*   **UI/UX & Component Design:** I developed the complete user interface using **React and Tailwind CSS**, creating over 20 reusable components. This included designing the marketing pages (`Hero`, `Features`), core layouts, and the complex, role-specific dashboards for Institutions, Departments, and Public Users.
*   **Interactive Data Visualization:** I integrated **Recharts** and **Google Charts** to build the analytics suite, transforming raw API data into intuitive Sankey, Pie, and Bar charts to visualize financial flows and spending trends.
*   **API Integration:** I managed the frontend-to-backend communication layer using a centralized `axios` instance, handling all API requests and implementing robust error handling to ensure a smooth user experience.

#### Backend & Chatbot Development:
*   **Authentication & Security:** I contributed to the backend by implementing the secure, multi-role JWT authentication system, including the logic for creating tokens, attaching secure `httpOnly` cookies, and defining protected routes.
*   **AI Chatbot:** I engineered the frontend and backend for the **AI Financial Assistant**. This involved creating the chat session management on the server, crafting the detailed prompts for the **Google Gemini API**, and building the responsive, interactive chat window in React.

---

## The Problem

Financial data in public institutions is often trapped in complex spreadsheets, dense PDFs, and siloed departments. This opacity makes it difficult to track the flow of money, creates opportunities for misuse, and leaves stakeholders like citizens, students, and donors completely in the dark. How can we trust numbers that are hard to access, difficult to understand, and impossible to verify?

## Our Solution: The "Crystl" Ecosystem

Crystl tackles this problem with a three-pronged approach: **Automate**, **Verify**, and **Visualize**. We built a comprehensive platform with distinct, tailored experiences for every stakeholder.

### Key Features

#### 🤖 1. AI-Powered Data Ingestion Engine
We eliminated the #1 barrier to transparency: manual data entry.
- **Multi-Format Upload:** Institutions can upload raw financial documents as **CSVs or even unstructured PDFs**.
-   **Intelligent Structuring:** We use **Google Cloud Vision API** for OCR and the **Gemini LLM** to intelligently parse documents, identify transactions, and structure messy data into a clean, usable format.
-   **Automated Routing:** The structured data is then routed to the correct departments for verification.

<p align="center">
  <img src="https://raw.githubusercontent.com/rajathnh/Crystl/main/Images/Pic%201.png" alt="AI Upload Modal" width="48%">
  &nbsp;
  <img src="https://raw.githubusercontent.com/rajathnh/Crystl/main/Images/Pic2.png" alt="AI Extraction Results" width="48%">
</p>

---

#### 📊 2. Advanced Analytics & Visualization Suite
Data is useless if you can't understand it. Our public-facing dashboards turn complex numbers into intuitive stories.
- **Multi-Level Fund Flow:** Interactive **Sankey diagrams** visualize the complete journey of funds from the institution down to the final vendor.
-   **Spending Breakdowns:** **Pie and Bar charts** provide instant insights into spending by department and track trends over time.
-   **Granular Transaction Log:** A fully searchable and paginated table provides ultimate detail.

<p align="center">
  <img src="https://raw.githubusercontent.com/rajathnh/Crystl/main/Images/Pic3.png" alt="Advanced Data Visualization Dashboard" width="800"/>
</p>

---

#### ✅ 3. Two-Party Verification Workflow
To ensure data accuracy, nothing is accepted blindly.
- **Pending Approvals:** Allocations created by an institution appear in the respective department's dashboard as "pending".
-   **Approve or Dispute:** Departments must digitally approve every transaction, creating a human-level check and balance.

<p align="center">
  <img src="https://raw.githubusercontent.com/rajathnh/Crystl/main/Images/Pic4.png" alt="Department Approval Workflow" width="600"/>
</p>

---

#### 🏆 4. Additional High-Impact Features

| Anomaly Detection | AI Financial Assistant |
| :---: | :---: |
| <img src="https://raw.githubusercontent.com/rajathnh/Crystl/main/Images/Pic5.png" alt="Anomaly Detection Alerts" width="100%"/> | <img src="https://raw.githubusercontent.com/rajathnh/Crystl/main/Images/Pic6.png" alt="AI Chatbot Assistant" width="100%"/> |
| **Community Feedback Forum** | **Multi-Currency Support (USD/INR)** |
| <img src="https://raw.githubusercontent.com/rajathnh/Crystl/main/Images/Pic7.png" alt="Community Chat Forum" width="100%"/> | <img src="https://raw.githubusercontent.com/rajathnh/Crystl/main/Images/Pic8.png" alt="Multi-Currency Toggle and Results" width="100%"/> |

---

## Tech Stack

| Area      | Technologies                                                                 |
|-----------|------------------------------------------------------------------------------|
| **Frontend**  | React, Vite, JavaScript (ES6+), Tailwind CSS, Material-UI, Recharts, `react-router-dom`, Axios |
| **Backend**   | Node.js, Express, MongoDB, Mongoose                                        |
| **AI & Cloud**| Google Gemini API, Google Cloud Vision API                                   |
| **Auth**      | JWT (JSON Web Tokens), `cookie-parser`, `bcryptjs`                           |
| **Deployment**| Vercel (Frontend), Render/GCP (Backend)                                      |

## Getting Started

### Prerequisites
- Node.js (v20+)
- MongoDB Atlas account or local instance
- Google Cloud Platform account with Vision API and Gemini enabled
- `.env` file with necessary API keys and secrets

### Installation & Setup

1.  **Clone your forked repository:**
    ```bash
    git clone https://github.com/your-username/Crystl.git
    cd Crystl
    ```

2.  **Setup Backend:**
    ```bash
    cd backend
    npm install
    # Create a .env file from .env.example and add your variables
    npm run dev
    ```

3.  **Setup Frontend:**
    ```bash
    cd ../frontend
    npm install
    # Create a .env.local file and add your VITE_API_URL
    npm run dev
    ```
