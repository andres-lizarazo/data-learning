import { lazy } from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";

// Route-level code-splitting: each page (and its heavy deps — react-markdown,
// visualizers, etc.) loads on demand, keeping the initial bundle small.
const Home = lazy(() => import("./pages/Home"));
const ModulePage = lazy(() => import("./pages/ModulePage"));
const LessonPage = lazy(() => import("./pages/LessonPage"));
const Playground = lazy(() => import("./pages/Playground"));
const SqlPlayground = lazy(() => import("./pages/SqlPlayground"));
const Profile = lazy(() => import("./pages/Profile"));
const Practice = lazy(() => import("./pages/Practice"));
const Roadmap = lazy(() => import("./pages/Roadmap"));
const Review = lazy(() => import("./pages/Review"));
const Reference = lazy(() => import("./pages/Reference"));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="learn/:moduleId" element={<ModulePage />} />
        <Route path="learn/:moduleId/:lessonId" element={<LessonPage />} />
        <Route path="playground" element={<Playground />} />
        <Route path="sql-playground" element={<SqlPlayground />} />
        <Route path="profile" element={<Profile />} />
        <Route path="practice" element={<Practice />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="review" element={<Review />} />
        <Route path="reference" element={<Reference />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
