import Color from "colorjs.io";

export async function copyToClipboard(text: string) {
	try {
		return navigator.clipboard.writeText(text);
	} catch (err) {
		return Promise.reject(err);
	}
}

export function parse_coords(coords: number | string) {
	if (typeof coords === "string") {
		coords = parseFloat(coords);
	}
	return Math.max(0, Math.min(100, coords));
}

export function contrast_color(c: string) {
	try {
		const color = new Color(c);

		// Prefer WCAG 2.1 contrast if available for best readability
		let whContrast: number;
		let blContrast: number;
		try {
			// Contrast ratios per WCAG 2.1
			// ColorJS: contrast(reference, method?)
			// Fall back to L* if the method isn't supported in the current environment
			// @ts-ignore - method overloads
			whContrast =
				color.contrast("white", "WCAG21") ?? color.contrastLstar("white");
			// @ts-ignore - method overloads
			blContrast =
				color.contrast("black", "WCAG21") ?? color.contrastLstar("black");
		} catch {
			whContrast = color.contrastLstar("white");
			blContrast = color.contrastLstar("black");
		}

		return whContrast > blContrast ? "white" : "black";
	} catch {}

	// Fallback to black if color parsing fails
	return "black";
}

export function contrast_color_with_alpha(c: string) {
	try {
		const color = new Color(contrast_color(c));
		color.alpha = 0.6;
		return color.to("oklch");
	} catch {}
}

export function contrast_color_prefer_white(c: string) {
	try {
		const color = new Color(c);

		const whContrast = color.contrastLstar("white");

		return whContrast >= 8 || color.c.valueOf() > 0.1 ? "white" : "black";
	} catch {}
}

export function isCylindricalSpace(space: string): Boolean {
	return ["hsl", "hwb", "lch", "oklch"].includes(space);
}

export function whatsTheGamutDamnit(color: string) {
	let gamut = "srgb";

	if (color?.startsWith("#")) return gamut;

	try {
		const srgb = new Color("srgb", new Color(color).to("srgb").coords);
		const p3 = new Color("p3", new Color(color).to("p3").coords);
		const rec2020 = new Color("rec2020", new Color(color).to("rec2020").coords);
		const xyz = new Color("xyz", new Color(color).to("xyz").coords);

		if (xyz.inGamut()) gamut = "xyz";
		if (rec2020.inGamut()) gamut = "rec2020";
		if (p3.inGamut()) gamut = "p3";
		if (srgb.inGamut()) gamut = "srgb";
	} catch (e) {
		console.error(e);
		return gamut;
	}

	return gamut;
}

export function getColorJSspaceID(space: string) {
	if (space === "display-p3") return "p3";
	if (space === "a98-rgb") return "a98rgb";
	return space;
}

export function reverseColorJSspaceID(space: string) {
	if (space === "p3") return "display-p3";
	if (space === "a98rgb") return "a98-rgb";
	return space;
}
