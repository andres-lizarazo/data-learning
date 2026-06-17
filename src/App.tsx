import { Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import ModulePage from "./pages/ModulePage";
import LessonPage from "./pages/LessonPage";
import Playground from "./pages/Playground";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="learn/:moduleId" element={<ModulePage />} />
        <Route path="learn/:moduleId/:lessonId" element={<LessonPage />} />
        <Route path="playground" element={<Playground />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
