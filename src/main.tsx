import { render } from "preact";
import ColorPicker, { picker_value } from "./ColorPicker.tsx";
import { useId } from "preact/hooks";

render(<App />, document.getElementById("app")!);

function App() {
	const pickerId = useId();

	return (
		<div style={{ padding: 16 }}>
			<h1>Color Picker</h1>
			<button popoverTarget={pickerId}>Open</button>
			<ColorPicker
				popover
				id={pickerId}
				style={{
					position: "absolute",
					positionArea: "block-end span-inline-end",
					positionTryFallbacks: "flip-inline, flip-block",
				}}
			/>
			<output
				style={{
					display: "block",
					marginBlockStart: 8,
				}}
			>
				Value: <code>{picker_value}</code>
			</output>
		</div>
	);
}
