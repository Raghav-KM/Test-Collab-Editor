import "./App.css";
import { TextEditor } from "./components/TextEditor";

function App() {
    return (
        <div className="w-100vw h-[100vh] bg-black flex justify-center">
            <div className="w-[720px] h-full p-4">
                <TextEditor />
            </div>
        </div>
    );
}

export default App;
