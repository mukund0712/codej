import React, { useEffect, useRef, useState } from 'react';
import Codemirror from 'codemirror';
import Babel from '@babel/standalone';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions';

// Internal CSS styles for the Editor component
const editorStyles = `
    .editor-container {
        overflow: hidden; /* Hide overflow to remove scrollbar */
        height: 100vh; /* Fill the entire viewport height */
        display: flex;
        flex-direction: column;
    }

    /* Add more custom styles as needed */
`;

// Editor component
const Editor = ({ socketRef, roomId, onCodeChange }) => {
    const editorRef = useRef(null);
    const outputRef = useRef(null);
    const [language, setLanguage] = useState('javascript');

    // Initialize the CodeMirror instance
    useEffect(() => {
        async function init() {
            editorRef.current = Codemirror.fromTextArea(
                document.getElementById('realtimeEditor'),
                {
                    mode: { name: 'javascript', json: true },
                    theme: 'dracula',
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    lineNumbers: true,
                }
            );

            // Listen for changes in the editor
            editorRef.current.on('change', (instance, changes) => {
                const { origin } = changes;
                const code = instance.getValue();
                onCodeChange(code);

                // Emit code change event if the change is not from setValue
                if (origin !== 'setValue') {
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        code,
                    });
                }
            });
        }
        init();
    }, []);

    // Listen for code change events from the server
    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                if (code !== null) {
                    editorRef.current.setValue(code);
                }
            });
        }

        return () => {
            socketRef.current.off(ACTIONS.CODE_CHANGE);
        };
    }, [socketRef.current]);

    useEffect(() => {
        compileCode(); // Call the compileCode function when language changes
    }, [language]);

    const compileCode = () => {
        const code = editorRef.current.getValue();
    
        // Compile the code based on the selected language
        try {
            let compiledCode;
            switch (language) {
                case 'javascript':
                    compiledCode = Babel.transform(code, { presets: ['es2015', 'react'] }).code;
                    break;
                case 'python':
                    // Use a Python compiler
                    break;
                case 'java':
                    // Use a Java compiler
                    break;
                case 'c++':
                    // Use a C++ compiler
                    break;
                default:
                    break;
            }
            outputRef.current.textContent = compiledCode;
    
            // Run the compiled code and display the output
            try {
                const output = new Function('return ' + compiledCode)();
                outputRef.current.textContent += '\nOutput: ' + output;
            } catch (error) {
                outputRef.current.textContent += '\nError: ' + error.message;
            }
        } catch (error) {
            outputRef.current.textContent = 'Compilation error: ' + error.message;
        }
    };
    
    return (
        <div className="editor-container">
            <textarea id="realtimeEditor"></textarea>
            <pre ref={outputRef}></pre>
            <button onClick={compileCode}>Compile</button>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="c++">C++</option>
            </select>
            {/* Internal CSS */}
            <style>{editorStyles}</style>
        </div>
    );
};

export default Editor;
