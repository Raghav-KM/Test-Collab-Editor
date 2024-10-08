import "./App.css";
import { DualEdtorPage } from "./pages/DualEditorsPage";

function App() {
    return (
        <div className="w-full h-[100vh] bg-black flex justify-center p-4 ">
            <DualEdtorPage />
            {/* <CursorEditor /> */}
        </div>
    );
}

export default App;
