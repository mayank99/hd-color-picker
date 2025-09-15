import { useEffect, useRef } from "preact/hooks";
import { useComputed } from "@preact/signals";
import { signal } from "@preact/signals";
import Color from "colorjs.io";

import type { ComponentProps } from "preact";

import {
	copyToClipboard,
	parse_coords,
	contrast_color,
	whatsTheGamutDamnit,
	getColorJSspaceID,
	reverseColorJSspaceID,
} from "./utils.ts";

import "./ColorPicker.css";

export default function ColorPicker(props: ComponentProps<"dialog">) {
	const dialogRef = useRef<HTMLDialogElement | null>(null);
	const colorSpaceSelectRef = useRef<HTMLSelectElement | null>(null);

	function setColor(color: Color | string) {
		const parsedColor = new Color(color);
		colorspace.value = reverseColorJSspaceID(parsedColor.space.id);

		const dialog = dialogRef.current;
		const colorSpaceSelect = colorSpaceSelectRef.current;
		if (!dialog || !colorSpaceSelect) return;

		colorSpaceSelect.value = colorspace.value;

		if (colorspace.value === "oklab") {
			const [l, a, b] = parsedColor.coords;
			oklabL.value = (parse_coords(l) * 100).toFixed();
			oklabA.value = a.toFixed(2).toString();
			oklabB.value = b.toFixed(2).toString();
			oklabAlpha.value = (parsedColor.alpha * 100).toFixed();
		} else if (colorspace.value === "oklch") {
			const [l, c, h] = parsedColor.coords;
			oklchL.value = (parse_coords(l) * 100).toFixed();
			oklchC.value = c.toFixed(2).toString();
			oklchH.value = isNaN(h) ? "0" : h.toFixed().toString();
			oklchAlpha.value = (parsedColor.alpha * 100).toFixed();
		} else if (colorspace.value === "lab") {
			const [l, a, b] = parsedColor.coords;
			labL.value = parse_coords(l).toFixed();
			labA.value = a.toFixed().toString();
			labB.value = b.toFixed().toString();
			labAlpha.value = (parsedColor.alpha * 100).toFixed();
		} else if (colorspace.value === "lch") {
			const [l, c, h] = parsedColor.coords;
			lchL.value = parse_coords(l).toFixed();
			lchC.value = c.toFixed().toString();
			lchH.value = h.toFixed().toString();
			lchAlpha.value = (parsedColor.alpha * 100).toFixed();
		} else if (colorspace.value === "hsl") {
			const [h, s, l] = parsedColor.coords;
			console.log("coords", { h, s, l });
			hslL.value = parse_coords(l).toFixed();
			hslS.value = parse_coords(s).toFixed();
			hslH.value = h.toFixed().toString();
			hslAlpha.value = (parsedColor.alpha * 100).toFixed();
		} else if (colorspace.value === "hwb") {
			const [h, w, b] = parsedColor.coords;
			hwbH.value = h.toString();
			hwbW.value = parse_coords(w).toFixed();
			hwbB.value = parse_coords(b).toFixed();
			hwbAlpha.value = (parsedColor.alpha * 100).toFixed();
		} else if (colorspace.value === "srgb" || colorspace.value === "rgb") {
			const [r, g, b] = parsedColor.toGamut({
				space: "srgb",
				method: "clip",
			}).coords;
			rgbR.value = (parse_coords(r) * 100).toFixed();
			rgbG.value = (parse_coords(g) * 100).toFixed();
			rgbB.value = (parse_coords(b) * 100).toFixed();
			rgbAlpha.value = (parsedColor.alpha * 100).toFixed();
		} else if (isRGBcolor(colorspace.value)) {
			const [r, g, b] = parsedColor.coords;
			colorR.value = (parse_coords(r.valueOf()) * 100).toFixed();
			colorG.value = (parse_coords(g.valueOf()) * 100).toFixed();
			colorB.value = (parse_coords(b.valueOf()) * 100).toFixed();
			colorAlpha.value = (parsedColor.alpha * 100).toFixed();
		}
	}

	function gencolor(colorspace: string, _colorChannelValues: string[]) {
		let color;

		if (colorspace === "oklab")
			color = `oklab(${oklabL.value}% ${oklabA.value} ${
				oklabB.value
			}${alphaToString(oklabAlpha.value)})`;
		else if (colorspace === "oklch")
			color = `oklch(${oklchL.value}% ${oklchC.value} ${
				oklchH.value
			}${alphaToString(oklchAlpha.value)})`;
		else if (colorspace === "lab")
			color = `lab(${labL.value}% ${labA.value} ${labB.value}${alphaToString(
				labAlpha.value
			)})`;
		else if (colorspace === "lch")
			color = `lch(${lchL.value}% ${lchC.value} ${lchH.value}${alphaToString(
				lchAlpha.value
			)})`;
		else if (colorspace === "hsl")
			color = `hsl(${hslH.value} ${hslS.value}% ${hslL.value}%${alphaToString(
				hslAlpha.value
			)})`;
		else if (colorspace === "hwb")
			color = `hwb(${hwbH.value} ${hwbW.value}% ${hwbB.value}%${alphaToString(
				hwbAlpha.value
			)})`;
		else if (colorspace === "srgb")
			color = `rgb(${rgbR.value}% ${rgbG.value}% ${rgbB.value}%${alphaToString(
				rgbAlpha.value
			)})`;
		else if (isRGBcolor(colorspace)) color = rgbColor();

		return color;
	}

	function alphaToString(alpha: string | number) {
		return alpha === "100" || alpha === 100 ? "" : ` / ${alpha}%`;
	}

	function rgbColor() {
		return `color(${
			colorspace.value === "prophoto" ? "prophoto-rgb" : colorspace.value
		} ${colorR.value}% ${colorG.value}% ${colorB.value}%${alphaToString(
			colorAlpha.value
		)})`;
	}

	function isRGBcolor(space: string) {
		return [
			"srgb-linear",
			"display-p3",
			"rec2020",
			"a98-rgb",
			"prophoto",
			"xyz",
			"xyz-d50",
			"xyz-d65",
		].includes(space);
	}

	function spaceChange(e: Event) {
		if (!(e.currentTarget instanceof HTMLSelectElement)) return;

		const current = new Color(picker_value.value);
		const newColor = current
			.to(getColorJSspaceID(e.currentTarget.value))
			.toGamut();
		setColor(newColor);
		colorspace.value = e.currentTarget.value;
	}

	function copyColor() {
		copyToClipboard(picker_value.value);
	}

	// Update picker_value when any color values change
	useEffect(() => {
		picker_value.value =
			gencolor(colorspace.value, [
				oklabL.value,
				oklabA.value,
				oklabB.value,
				oklabAlpha.value,
				oklchL.value,
				oklchC.value,
				oklchH.value,
				oklchAlpha.value,
				labL.value,
				labA.value,
				labB.value,
				labAlpha.value,
				lchL.value,
				lchC.value,
				lchH.value,
				lchAlpha.value,
				hslH.value,
				hslS.value,
				hslL.value,
				hslAlpha.value,
				hwbH.value,
				hwbW.value,
				hwbB.value,
				hwbAlpha.value,
				rgbR.value,
				rgbG.value,
				rgbB.value,
				rgbAlpha.value,
				colorR.value,
				colorG.value,
				colorB.value,
				colorAlpha.value,
			]) || "#000";
	});

	const text_overlay = useComputed(() => contrast_color(picker_value.value));
	const bg_overlay = useComputed(() =>
		contrast_color(text_overlay.value || "#000")
	);
	const gamut = useComputed(() => whatsTheGamutDamnit(picker_value.value));

	return (
		<dialog
			{...props}
			ref={(element) => {
				dialogRef.current = element;
				if (typeof props.ref === "function") {
					props.ref(element);
				} else if (props.ref) {
					props.ref.current = element;
				}
			}}
		>
			<div
				className="hd-color-picker"
				style={{
					"accent-color": picker_value.value,
					"--contrast-color": bg_overlay.value,
					"--counter-contrast-color": text_overlay.value,
				}}
			>
				<div className="preview" style={{ "--user-color": picker_value.value }}>
					<select
						ref={colorSpaceSelectRef}
						className="colorspace"
						onChange={spaceChange}
						title="Colorspace"
						style={{
							"--icon-arrow-up": `url(https://api.iconify.design/ic:keyboard-arrow-up.svg?color=${text_overlay.value})`,
							"--icon-arrow-down": `url(https://api.iconify.design/ic:keyboard-arrow-down.svg?color=${text_overlay.value})`,
						}}
					>
						<optgroup label="Standard">
							<option value="srgb">rgb</option>
							<option>srgb-linear</option>
							<option>hsl</option>
							<option>hwb</option>
						</optgroup>
						<optgroup label="HDR">
							<option>display-p3</option>
							<option>a98-rgb</option>
						</optgroup>
						<optgroup label="Ultra HDR">
							<option>lab</option>
							<option>lch</option>
							<option selected>oklch</option>
							<option>oklab</option>
							<option>rec2020</option>
							<option>prophoto</option>
							<option>xyz</option>
							<option>xyz-d50</option>
							<option>xyz-d65</option>
						</optgroup>
					</select>
					<div className="gamut" title="Gamut">
						{gamut.value}
					</div>
					<output className="color-information" onClick={copyColor}>
						{picker_value.value}
						<svg width="32" height="32" viewBox="0 0 24 24">
							<path
								fill="currentColor"
								d="M5 22q-.825 0-1.413-.588T3 20V6h2v14h11v2H5Zm4-4q-.825 0-1.413-.588T7 16V4q0-.825.588-1.413T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.588 1.413T18 18H9Z"
							/>
						</svg>
					</output>
				</div>

				<div className="controls">
					{colorspace.value === "oklab" && (
						<>
							<div class="control">
								<span class="control-channel">L</span>
								<input
									class="control-input"
									type="range"
									min="0"
									max="100"
									value={oklabL.value}
									onInput={(e) => (oklabL.value = e.currentTarget.value)}
									style="background-image: linear-gradient(in oklab to right, black, white)"
								/>
								<input
									type="number"
									value={oklabL.value}
									onInput={(e) => (oklabL.value = e.currentTarget.value)}
									min="0"
									max="100"
									class="slider-percentage"
								/>
							</div>

							<div class="control">
								<span class="control-channel">A</span>
								<input
									class="control-input"
									type="range"
									min="-.5"
									max=".5"
									step=".01"
									value={oklabA.value}
									onInput={(e) => (oklabA.value = e.currentTarget.value)}
									style="background-image: linear-gradient(to right in oklab, oklab(65% -.5 .5), oklab(65% .5 .5))"
								/>
								<input
									type="number"
									min="-.5"
									max=".5"
									step=".01"
									value={oklabA.value}
									onInput={(e) => (oklabA.value = e.currentTarget.value)}
									class="slider-percentage"
								/>
							</div>

							<div class="control">
								<span class="control-channel">B</span>
								<input
									class="control-input"
									type="range"
									min="-.5"
									max=".5"
									step=".01"
									value={oklabB.value}
									onInput={(e) => (oklabB.value = e.currentTarget.value)}
									style="background-image: linear-gradient(to right in oklab, oklab(47% -.03 -.32), oklab(96% 0 .25))"
								/>
								<input
									type="number"
									min="-.5"
									max=".5"
									step=".01"
									value={oklabB.value}
									onInput={(e) => (oklabB.value = e.currentTarget.value)}
									class="slider-percentage"
								/>
							</div>

							<div class="control percentage">
								<span class="control-channel">A</span>
								<input
									class="control-input alpha"
									type="range"
									min="0"
									max="100"
									value={oklabAlpha.value}
									onInput={(e) => (oklabAlpha.value = e.currentTarget.value)}
								/>
								<input
									type="number"
									min="0"
									max="100"
									value={oklabAlpha.value}
									onInput={(e) => (oklabAlpha.value = e.currentTarget.value)}
									class="slider-percentage"
								/>
							</div>
						</>
					)}

					{colorspace.value === "oklch" && (
						<>
							<div class="control">
								<span class="control-channel">L</span>
								<input
									class="control-input"
									type="range"
									value={oklchL.value}
									onInput={(e) => (oklchL.value = e.currentTarget.value)}
									style="background-image: linear-gradient(in oklab to right, black, white)"
								/>
								<input
									type="number"
									value={oklchL.value}
									onInput={(e) => (oklchL.value = e.currentTarget.value)}
									min="0"
									max="100"
									class="slider-percentage"
								/>
							</div>

							<div class="control">
								<span class="control-channel">C</span>
								<input
									class="control-input"
									type="range"
									min="0"
									max=".5"
									step=".01"
									value={oklchC.value}
									onInput={(e) => (oklchC.value = e.currentTarget.value)}
									style={{
										backgroundImage: `linear-gradient(to right in oklab, oklch(${oklchL.value}% 0 ${oklchH.value}), oklch(${oklchL.value}% .5 ${oklchH.value}))`,
									}}
								/>
								<input
									type="number"
									value={oklchC.value}
									onInput={(e) => (oklchC.value = e.currentTarget.value)}
									min="0"
									max=".5"
									step=".01"
									class="slider-percentage"
								/>
							</div>

							<div class="control">
								<span class="control-channel">H</span>
								<input
									class="control-input"
									type="range"
									min="0"
									max="360"
									value={oklchH.value}
									onInput={(e) => (oklchH.value = e.currentTarget.value)}
									style={{
										backgroundImage: `linear-gradient(to right in oklch longer hue, oklch(95% ${oklchC.value} 0), oklch(95% ${oklchC.value} 0))`,
									}}
								/>
								<input
									type="number"
									value={oklchH.value}
									onInput={(e) => (oklchH.value = e.currentTarget.value)}
									min="0"
									max="360"
									class="slider-percentage"
								/>
							</div>

							<div class="control">
								<span class="control-channel">A</span>
								<input
									class="control-input alpha"
									type="range"
									value={oklchAlpha.value}
									onInput={(e) => (oklchAlpha.value = e.currentTarget.value)}
								/>
								<input
									type="number"
									value={oklchAlpha.value}
									onInput={(e) => (oklchAlpha.value = e.currentTarget.value)}
									min="0"
									max="100"
									class="slider-percentage"
								/>
							</div>
						</>
					)}

					{colorspace.value === "lab" && (
						<>
							<div class="control">
								<span class="control-channel">L</span>
								<input
									class="control-input"
									type="range"
									value={labL.value}
									onInput={(e) => (labL.value = e.currentTarget.value)}
									style="background-image: linear-gradient(in lab to right, black, white)"
								/>
								<input
									type="number"
									value={labL.value}
									onInput={(e) => (labL.value = e.currentTarget.value)}
									min="0"
									max="100"
									class="slider-percentage"
								/>
							</div>

							<div class="control">
								<span class="control-channel">A</span>
								<input
									class="control-input"
									type="range"
									min="-160"
									max="160"
									value={labA.value}
									onInput={(e) => (labA.value = e.currentTarget.value)}
									style="background-image: linear-gradient(to right in oklab, lab(85% -100 100), lab(55% 100 100))"
								/>
								<input
									type="number"
									value={labA.value}
									onInput={(e) => (labA.value = e.currentTarget.value)}
									min="-160"
									max="160"
									class="slider-percentage"
								/>
							</div>

							<div class="control">
								<span class="control-channel">B</span>
								<input
									class="control-input"
									type="range"
									min="-160"
									max="160"
									value={labB.value}
									onInput={(e) => (labB.value = e.currentTarget.value)}
									style="background-image: linear-gradient(to right in oklab, lab(31% 70 -120), lab(96% 0 120))"
								/>
								<input
									type="number"
									value={labB.value}
									onInput={(e) => (labB.value = e.currentTarget.value)}
									min="-160"
									max="160"
									class="slider-percentage"
								/>
							</div>

							<div class="control">
								<span class="control-channel">A</span>
								<input
									class="control-input alpha"
									type="range"
									value={labAlpha.value}
									onInput={(e) => (labAlpha.value = e.currentTarget.value)}
								/>
								<input
									type="number"
									value={labAlpha.value}
									onInput={(e) => (labAlpha.value = e.currentTarget.value)}
									min="0"
									max="100"
									class="slider-percentage"
								/>
							</div>
						</>
					)}

					{colorspace.value === "lch" && (
						<>
							<div class="control">
								<span class="control-channel">L</span>
								<input
									class="control-input"
									type="range"
									value={lchL.value}
									onInput={(e) => (lchL.value = e.currentTarget.value)}
									style="background-image: linear-gradient(in lab to right, black, white)"
								/>
								<input
									type="number"
									value={lchL.value}
									onInput={(e) => (lchL.value = e.currentTarget.value)}
									min="0"
									max="100"
									class="slider-percentage"
								/>
							</div>

							<div class="control">
								<span class="control-channel">C</span>
								<input
									class="control-input"
									type="range"
									min="0"
									max="230"
									value={lchC.value}
									onInput={(e) => (lchC.value = e.currentTarget.value)}
									style={{
										backgroundImage: `linear-gradient(to right in oklab, lch(${lchL.value}% 0 ${lchH.value}), lch(${lchL.value}% 230 ${lchH.value}))`,
									}}
								/>
								<input
									type="number"
									value={lchC.value}
									onInput={(e) => (lchC.value = e.currentTarget.value)}
									min="0"
									max="230"
									class="slider-percentage"
								/>
							</div>

							<div class="control">
								<span class="control-channel">H</span>
								<input
									class="control-input"
									type="range"
									min="0"
									max="360"
									value={lchH.value}
									onInput={(e) => (lchH.value = e.currentTarget.value)}
									style={{
										backgroundImage: `linear-gradient(to right in lch longer hue, lch(95% ${lchC.value} 0), lch(95% ${lchC.value} 0))`,
									}}
								/>
								<input
									type="number"
									value={lchH.value}
									onInput={(e) => (lchH.value = e.currentTarget.value)}
									min="0"
									max="360"
									class="slider-percentage"
								/>
							</div>

							<div class="control">
								<span class="control-channel">A</span>
								<input
									class="control-input alpha"
									type="range"
									value={lchAlpha.value}
									onInput={(e) => (lchAlpha.value = e.currentTarget.value)}
								/>
								<input
									type="number"
									value={lchAlpha.value}
									onInput={(e) => (lchAlpha.value = e.currentTarget.value)}
									min="0"
									max="100"
									class="slider-percentage"
								/>
							</div>
						</>
					)}

					{colorspace.value === "hsl" && (
						<>
							<div class="control">
								<span class="control-channel">H</span>
								<input
									class="control-input"
									type="range"
									min="0"
									max="360"
									value={hslH.value}
									onInput={(e) => (hslH.value = e.currentTarget.value)}
									style={{
										backgroundImage: `linear-gradient(to right in hsl longer hue, hsl(0 ${hslS.value} 50%), hsl(0 ${hslS.value} 50%))`,
									}}
								/>
								<input
									type="number"
									value={hslH.value}
									onInput={(e) => (hslH.value = e.currentTarget.value)}
									min="0"
									max="360"
									class="slider-percentage"
								/>
							</div>

							<div class="control">
								<span class="control-channel">S</span>
								<input
									class="control-input"
									type="range"
									value={hslS.value}
									onInput={(e) => (hslS.value = e.currentTarget.value)}
									style={{
										backgroundImage: `linear-gradient(to right in oklab, hsl(${hslH.value} 0% ${hslL.value}%), hsl(${hslH.value} 100% ${hslL.value}%))`,
									}}
								/>
								<input
									type="number"
									value={hslS.value}
									onInput={(e) => (hslS.value = e.currentTarget.value)}
									min="0"
									max="100"
									class="slider-percentage"
								/>
							</div>

							<div class="control">
								<span class="control-channel">L</span>
								<input
									class="control-input"
									type="range"
									value={hslL.value}
									onInput={(e) => (hslL.value = e.currentTarget.value)}
									style={{
										backgroundImage: `linear-gradient(to right in oklab, hsl(${hslH.value} ${hslS.value}% 0%), hsl(${hslH.value} ${hslS.value}% 100%))`,
									}}
								/>
								<input
									type="number"
									value={hslL.value}
									onInput={(e) => (hslL.value = e.currentTarget.value)}
									min="0"
									max="100"
									class="slider-percentage"
								/>
							</div>

							<div class="control">
								<span class="control-channel">A</span>
								<input
									class="control-input alpha"
									type="range"
									min="0"
									max="100"
									value={hslAlpha.value}
									onInput={(e) => (hslAlpha.value = e.currentTarget.value)}
								/>
								<input
									type="number"
									value={hslAlpha.value}
									onInput={(e) => (hslAlpha.value = e.currentTarget.value)}
									min="0"
									max="100"
									class="slider-percentage"
								/>
							</div>
						</>
					)}

					{colorspace.value === "hwb" && (
						<>
							<div class="control">
								<span class="control-channel">H</span>
								<input
									class="control-input"
									type="range"
									min="0"
									max="360"
									value={hwbH.value}
									onInput={(e) => (hwbH.value = e.currentTarget.value)}
									style="background-image: linear-gradient(to right in hsl longer hue, red, red)"
								/>
								<input
									type="number"
									value={hwbH.value}
									onInput={(e) => (hwbH.value = e.currentTarget.value)}
									min="0"
									max="360"
									class="slider-percentage"
								/>
							</div>

							<div class="control">
								<span class="control-channel">W</span>
								<input
									class="control-input"
									type="range"
									value={hwbW.value}
									onInput={(e) => (hwbW.value = e.currentTarget.value)}
									style="background-image: linear-gradient(to right in oklab, #fff0, #fff); background-color: black"
								/>
								<input
									type="number"
									value={hwbW.value}
									onInput={(e) => (hwbW.value = e.currentTarget.value)}
									min="0"
									max="100"
									class="slider-percentage"
								/>
							</div>

							<div class="control">
								<span class="control-channel">B</span>
								<input
									class="control-input"
									type="range"
									value={hwbB.value}
									onInput={(e) => (hwbB.value = e.currentTarget.value)}
									style="background-image: linear-gradient(to right in oklab, #0000, #000); background-color: white"
								/>
								<input
									type="number"
									value={hwbB.value}
									onInput={(e) => (hwbB.value = e.currentTarget.value)}
									min="0"
									max="100"
									class="slider-percentage"
								/>
							</div>

							<div class="control">
								<span class="control-channel">A</span>
								<input
									class="control-input alpha"
									type="range"
									value={hwbAlpha.value}
									onInput={(e) => (hwbAlpha.value = e.currentTarget.value)}
								/>
								<input
									type="number"
									value={hwbAlpha.value}
									onInput={(e) => (hwbAlpha.value = e.currentTarget.value)}
									min="0"
									max="100"
									class="slider-percentage"
								/>
							</div>
						</>
					)}

					{colorspace.value === "srgb" && (
						<>
							<div class="control">
								<span class="control-channel">R</span>
								<input
									class="control-input"
									type="range"
									min="0"
									max="100"
									value={rgbR.value}
									onInput={(e) => (rgbR.value = e.currentTarget.value)}
									style="background-image: linear-gradient(to right in oklab, #f000, #f00); background-color: black;"
								/>
								<input
									type="number"
									value={rgbR.value}
									onInput={(e) => (rgbR.value = e.currentTarget.value)}
									min="0"
									max="100"
									class="slider-percentage"
								/>
							</div>

							<div class="control">
								<span class="control-channel">G</span>
								<input
									class="control-input"
									type="range"
									min="0"
									max="100"
									value={rgbG.value}
									onInput={(e) => (rgbG.value = e.currentTarget.value)}
									style="background-image: linear-gradient(to right in oklab, #0f00, #0f0); background-color: black;"
								/>
								<input
									type="number"
									value={rgbG.value}
									onInput={(e) => (rgbG.value = e.currentTarget.value)}
									min="0"
									max="100"
									class="slider-percentage"
								/>
							</div>

							<div class="control">
								<span class="control-channel">B</span>
								<input
									class="control-input"
									type="range"
									min="0"
									max="100"
									value={rgbB.value}
									onInput={(e) => (rgbB.value = e.currentTarget.value)}
									style="background-image: linear-gradient(to right in oklab, #00f0, #00f); background-color: black;"
								/>
								<input
									type="number"
									value={rgbB.value}
									onInput={(e) => (rgbB.value = e.currentTarget.value)}
									min="0"
									max="100"
									class="slider-percentage"
								/>
							</div>

							<div class="control">
								<span class="control-channel">A</span>
								<input
									class="control-input alpha"
									type="range"
									min="0"
									max="100"
									value={rgbAlpha.value}
									onInput={(e) => (rgbAlpha.value = e.currentTarget.value)}
								/>
								<input
									type="number"
									value={rgbAlpha.value}
									onInput={(e) => (rgbAlpha.value = e.currentTarget.value)}
									min="0"
									max="100"
									class="slider-percentage"
								/>
							</div>
						</>
					)}

					{isRGBcolor(colorspace.value) && (
						<>
							<div class="control">
								<span class="control-channel">R</span>
								<input
									class="control-input"
									type="range"
									value={colorR.value}
									onInput={(e) => (colorR.value = e.currentTarget.value)}
									style="background-image: linear-gradient(to right in oklab, #f000, #f00); background-color: black;"
								/>
								<input
									type="number"
									value={colorR.value}
									onInput={(e) => (colorR.value = e.currentTarget.value)}
									min="0"
									max="100"
									class="slider-percentage"
								/>
							</div>

							<div class="control">
								<span class="control-channel">G</span>
								<input
									class="control-input"
									type="range"
									value={colorG.value}
									onInput={(e) => (colorG.value = e.currentTarget.value)}
									style="background-image: linear-gradient(to right in oklab, #0f00, #0f0); background-color: black;"
								/>
								<input
									type="number"
									value={colorG.value}
									onInput={(e) => (colorG.value = e.currentTarget.value)}
									min="0"
									max="100"
									class="slider-percentage"
								/>
							</div>

							<div class="control">
								<span class="control-channel">B</span>
								<input
									class="control-input"
									type="range"
									value={colorB.value}
									onInput={(e) => (colorB.value = e.currentTarget.value)}
									style="background-image: linear-gradient(to right in oklab, #00f0, #00f); background-color: black;"
								/>
								<input
									type="number"
									value={colorB.value}
									onInput={(e) => (colorB.value = e.currentTarget.value)}
									min="0"
									max="100"
									class="slider-percentage"
								/>
							</div>

							<div class="control">
								<span class="control-channel">A</span>
								<input
									class="control-input alpha"
									type="range"
									min="0"
									max="100"
									value={colorAlpha.value}
									onInput={(e) => (colorAlpha.value = e.currentTarget.value)}
								/>
								<input
									type="number"
									value={colorAlpha.value}
									onInput={(e) => (colorAlpha.value = e.currentTarget.value)}
									min="0"
									max="100"
									class="slider-percentage"
								/>
							</div>
						</>
					)}
				</div>
			</div>
		</dialog>
	);
}

export const picker_value = signal("oklch(75% .3 180deg)");
const colorspace = signal("oklch");

const oklabL = signal("100");
const oklabA = signal("-0.2");
const oklabB = signal("0.5");
const oklabAlpha = signal("100");

const oklchL = signal("50");
const oklchC = signal("0.5");
const oklchH = signal("220");
const oklchAlpha = signal("100");

const labL = signal("100");
const labA = signal("-20");
const labB = signal("160");
const labAlpha = signal("100");

const lchL = signal("50");
const lchC = signal("100");
const lchH = signal("220");
const lchAlpha = signal("100");

const hslH = signal("220");
const hslS = signal("100");
const hslL = signal("50");
const hslAlpha = signal("100");

const hwbH = signal("323");
const hwbW = signal("0");
const hwbB = signal("0");
const hwbAlpha = signal("100");

const rgbR = signal("0");
const rgbG = signal("100");
const rgbB = signal("100");
const rgbAlpha = signal("100");

const colorR = signal("0");
const colorG = signal("100");
const colorB = signal("100");
const colorAlpha = signal("100");
