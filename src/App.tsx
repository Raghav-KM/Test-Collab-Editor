import "./App.css";
import { DualTextEditors } from "./components/DualTextEditors";

function App() {
    return (
        <div className="w-100vw h-[100vh] bg-black flex justify-center">
            <div className="w-[1600px] p-4">
                <DualTextEditors />
            </div>
        </div>
    );
}

export default App;
