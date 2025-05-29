import Color from "./color.js";

class Blender {
  constructor(ctx, theme) {
    this.ctx = ctx;
    this.styleCache = new Map();

    this.background = new Color(theme.background);
    this.foreground = new Color(theme.foreground);
    this.gradient = this.background.range(this.foreground);
    this.dark = this.background.lightness < this.foreground.lightness;

    // 배경색 제거 기능 설정
    this.removeBackgroundColors = theme.removeBackgroundColors || false;
    this.backgroundLightnessThreshold =
      theme.backgroundLightnessThreshold || 85;
    this.backgroundChromaThreshold = theme.backgroundChromaThreshold || 20;

    // 배경색으로 간주할 색상들 (제거할 색상들)
    this.backgroundColorsToRemove = theme.customBackgroundColors || [
      // 노란색 계열 - 더 많은 변형 추가
      "#FFFF00",
      "#FFFACD",
      "#FFFFE0",
      "#F0E68C",
      "#FFD700",
      "#FFEAA7",
      "#FDCB6E",
      "#F39C12",
      "#F1C40F",
      "#FFF8DC",
      "#FFFF99",
      "#FFFF66",
      "#FFFF33",
      "#FFFFCC",
      "#FFF5B7",
      "#FFE135",
      "#FFD93D",
      "#FFF700",
      "#FFEF00",
      "#FDFD96",
      // RGB 형태의 노란색들
      "rgb(255, 255, 0)",
      "rgb(255, 250, 205)",
      "rgb(255, 255, 224)",
      "rgb(240, 230, 140)",
      "rgb(255, 215, 0)",
      "rgb(253, 253, 150)",
      // 연한 회색 계열
      "#F5F5F5",
      "#EEEEEE",
      "#E0E0E0",
      "#D3D3D3",
      "#C0C0C0",
      "#F8F8F8",
      "#FAFAFA",
      "#FCFCFC",
      "#F0F0F0",
      "#E8E8E8",
      // 연한 파란색 계열
      "#E6F3FF",
      "#CCE7FF",
      "#B3DBFF",
      "#99CFFF",
      "#E1F5FE",
      "#F0F8FF",
      "#E6F7FF",
      "#F5FCFF",
      // 연한 초록색 계열
      "#E6FFE6",
      "#CCFFCC",
      "#B3FFB3",
      "#99FF99",
      "#F0FFF0",
      // 연한 빨간색 계열
      "#FFE6E6",
      "#FFCCCC",
      "#FFB3B3",
      "#FF9999",
      "#FFF0F0",
      // 연한 보라색 계열
      "#F3E5F5",
      "#E1BEE7",
      "#CE93D8",
      "#BA68C8",
      // 베이지/크림 계열
      "#FFF8E1",
      "#FFECB3",
      "#FFE082",
      "#FFF9C4",
      "#F5F5DC",
    ];

    // 디버깅 모드 (개발 중에만 사용)
    this.debugMode = theme.debugBackgroundRemoval || false;

    // Backup original methods
    this.origFill = this.ctx.fill.bind(this.ctx);
    this.origFillRect = this.ctx.fillRect.bind(this.ctx);
    this.origStroke = this.ctx.stroke.bind(this.ctx);
    this.origStrokeRect = this.ctx.strokeRect.bind(this.ctx);
    this.origFillText = this.ctx.fillText.bind(this.ctx);
    this.origDrawImage = this.ctx.drawImage.bind(this.ctx);

    // Intercept style properties
    this.origFillStyle = this.interceptStyleProperty("fillStyle");
    this.origStrokeSyle = this.interceptStyleProperty("strokeStyle");

    // Wrap drawing APIs
    this.ctx.fill = (...args) => {
      if (this.shouldSkipFill()) {
        return; // 배경색이면 채우기 무시
      }
      this.origFill(...args);
      this.deleteCachedImage();
    };

    this.ctx.fillRect = (...args) => {
      if (this.shouldSkipFill()) {
        return; // 배경색이면 채우기 무시
      }
      this.origFillRect(...args);
      this.deleteCachedImage();
    };

    this.ctx.stroke = (...args) => {
      this.origStroke(...args);
      this.deleteCachedImage();
    };

    this.ctx.strokeRect = (...args) => {
      this.origStrokeRect(...args);
      this.deleteCachedImage();
    };

    this.ctx.fillText = (...args) => {
      if (typeof this.ctx.fillStyle !== "string") {
        return this.origFillText(...args);
      }
      this.ctx.save();
      this.updateTextStyle(args);
      const retVal = this.origFillText(...args);
      this.ctx.restore();
      return retVal;
    };

    this.ctx.drawImage = (...args) => this.customDrawImage(args);
  }

  interceptStyleProperty(prop) {
    const proto = Object.getPrototypeOf(this.ctx);
    const descriptor = Object.getOwnPropertyDescriptor(proto, prop);

    const { get: originalGet, set: originalSet } = descriptor;
    Object.defineProperty(this.ctx, prop, {
      get: () => originalGet.call(this.ctx),
      set: v => {
        originalSet.call(this.ctx, v);
        const currentVal = originalGet.call(this.ctx);
        originalSet.call(this.ctx, this.getCanvasStyle(currentVal));
      },
      configurable: true,
      enumerable: true,
    });

    return val => {
      originalSet.call(this.ctx, val);
    };
  }

  /**
   * Removes all our property definitions and method wraps on this.ctx.
   */
  unwrap() {
    const proto = Object.getPrototypeOf(this.ctx);
    // Restore fillStyle and strokeStyle
    ["fillStyle", "strokeStyle"].forEach(prop => {
      const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
      Object.defineProperty(this.ctx, prop, {
        get: descriptor.get ? descriptor.get.bind(this.ctx) : undefined,
        set: descriptor.set ? descriptor.set.bind(this.ctx) : undefined,
        configurable: true,
        enumerable: true,
      });
    });
    // Restore original methods
    this.ctx.fill = proto.fill;
    this.ctx.fillRect = proto.fillRect;
    this.ctx.stroke = proto.stroke;
    this.ctx.strokeRect = proto.strokeRect;
    this.ctx.fillText = proto.fillText;
    this.ctx.drawImage = proto.drawImage;
  }

  deleteCachedImage() {
    delete this.cachedImage;
  }

  updateTextStyle(args) {
    const style = this.ctx.fillStyle;
    if (!this.hasBackgrounds) {
      return;
    }
    // text, x, y
    const bg = this.getCanvasColor(args[0], args[1], args[2]);
    const newStyle = this.getCanvasStyle(style, bg);
    if (newStyle !== style) {
      this.origFillStyle(newStyle);
    }
  }

  getCanvasStyle(style, bg) {
    if (typeof style !== "string") {
      return;
    }
    style = new Color(style);
    const key = style.hex + (bg?.hex || "");
    let newStyle = this.styleCache.get(key);
    if (!newStyle) {
      newStyle = bg ? this.getTextStyle(style, bg) : this.calcStyle(style);
      this.styleCache.set(key, newStyle);
    }
    return newStyle.toHex(style.alpha);
  }

  calcStyle(color) {
    if (color.chroma > 10) {
      if (this.dark) {
        return this.adjustColorForVisibility(this.foreground, color.hex);
      }
      return color;
    }
    const whiteL = Color.white.lightness;
    return this.gradient(1 - color.lightness / whiteL);
  }

  getTextStyle(color, textBg, minContrast = 30) {
    const diffL = clr => Math.abs(clr.lightness - textBg.lightness);

    if (this.background.deltaE(textBg) > 2.3 && diffL(color) < minContrast) {
      return [color, this.background, this.foreground].reduce((best, clr) =>
        diffL(clr) > diffL(best) ? clr : best
      );
    }
    return color;
  }

  hasDistinctColorsOverThreshold(imageData, threshold) {
    const { data } = imageData;
    const colorSet = new Set();
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const colorKey =
        (((r & 0xff) << 24) | ((g & 0xff) << 16) | ((b & 0xff) << 8) | 0xff) >>>
        0;
      colorSet.add(colorKey);
      if (colorSet.size > threshold) {
        return true;
      }
    }
    return false;
  }

  customDrawImage(args) {
    this.hasBackgrounds = true;
    delete this.cachedImage;

    const img = args[0];
    if (!img) {
      return this.origDrawImage(...args);
    }

    const [bgR, bgG, bgB] = this.background.rgb.map(e => e * 255);
    const [fgR, fgG, fgB] = this.foreground.rgb.map(e => e * 255);

    let sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight;
    if (args.length === 3) {
      [dx, dy] = [args[1], args[2]];
      sWidth = img.naturalWidth || img.width;
      sHeight = img.naturalHeight || img.height;
      [sx, sy, dWidth, dHeight] = [0, 0, sWidth, sHeight];
    } else if (args.length === 5) {
      [dx, dy, dWidth, dHeight] = [args[1], args[2], args[3], args[4]];
      sWidth = img.naturalWidth || img.width;
      sHeight = img.naturalHeight || img.height;
      [sx, sy] = [0, 0];
    } else if (args.length === 9) {
      [sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight] = args.slice(1);
    } else {
      return this.origDrawImage(...args);
    }

    const pageWidth = this.ctx.canvas.width;
    const pageHeight = this.ctx.canvas.height;

    const entirePage = dWidth >= pageWidth && dHeight >= pageHeight;

    const offCanvas = document.createElement("canvas");
    offCanvas.width = sWidth;
    offCanvas.height = sHeight;
    const offCtx = offCanvas.getContext("2d");
    offCtx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
    const imageData = offCtx.getImageData(0, 0, sWidth, sHeight);

    let colorThreshold;
    if (entirePage) {
      colorThreshold = 256;
    } else {
      // This is mainly necessary for IEEE TRANSACTIONS papers because they
      // use formulas as images instead of glyphs or vector graphics
      colorThreshold = 2;
    }

    const applyColors = !this.hasDistinctColorsOverThreshold(
      imageData,
      colorThreshold
    );
    const data = imageData.data;
    const whiteThreshold = 200;
    const blackThreshold = 50;
    const colorDeviation = 1;
    if (applyColors) {
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const avg = (r + g + b) / 3;
        const isNeutral = this.isColorNeutral(r, g, b, colorDeviation);
        if (isNeutral && avg > whiteThreshold) {
          data[i] = bgR;
          data[i + 1] = bgG;
          data[i + 2] = bgB;
        } else if (isNeutral && avg < blackThreshold) {
          data[i] = fgR;
          data[i + 1] = fgG;
          data[i + 2] = fgB;
        }
      }
      offCtx.putImageData(imageData, 0, 0);
      // draw the processed offCanvas
      if (args.length === 3) {
        this.origDrawImage(offCanvas, dx, dy);
      } else if (args.length === 5) {
        this.origDrawImage(offCanvas, dx, dy, dWidth, dHeight);
      } else {
        this.origDrawImage(
          offCanvas,
          0,
          0,
          sWidth,
          sHeight,
          dx,
          dy,
          dWidth,
          dHeight
        );
      }
      return;
    }

    // Set the blending mode and global alpha for controlled opacity
    this.ctx.globalCompositeOperation = "source-over"; // Blending mode (e.g., "source-over", "multiply", etc.)
    this.ctx.globalAlpha = 0.8; // Opacity of the image being blended (0 = fully transparent, 1 = fully opaque)
    this.origDrawImage(...args);
  }

  isColorNeutral(r, g, b, dev) {
    const r_g = Math.abs(r - g);
    const r_b = Math.abs(r - b);
    const g_b = Math.abs(g - b);
    return r_g < dev && r_b < dev && g_b < dev;
  }

  getCanvasColor(text, tx, ty) {
    if (!this.cachedImage) {
      const canvasWidth = this.ctx.canvas.width;
      const canvasHeight = this.ctx.canvas.height;
      this.cachedImage = this.ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    }

    const mtr = this.ctx.measureText(text);
    const dx = mtr.width / 2;
    const dy = (mtr.actualBoundingBoxAscent - mtr.actualBoundingBoxDescent) / 2;

    const tfm = this.ctx.getTransform();
    let { x, y } = tfm.transformPoint({ x: tx + dx, y: ty - dy });
    x = Math.round(x);
    y = Math.round(y);

    const canvasWidth = this.ctx.canvas.width;
    const canvasHeight = this.ctx.canvas.height;
    if (x < 0 || y < 0 || x >= canvasWidth || y >= canvasHeight) {
      console.warn("Coordinates out of bounds for canvas size.");
      return new Color([0, 0, 0]);
    }

    const index = (y * canvasWidth + x) * 4;
    const data = this.cachedImage.data;
    const rgb = [
      data[index] / 255,
      data[index + 1] / 255,
      data[index + 2] / 255,
    ];
    return new Color(rgb);
  }

  adjustColorForVisibility(background, color) {
    const bg = new Color(background);
    const fg = new Color(color);

    // Get original color's properties
    const [origL, origA, origB] = fg.lab;
    const origChroma = Math.hypot(origA, origB);
    const hue = origChroma > 0 ? Math.atan2(origB, origA) : 0;

    const targetL =
      bg.lightness < 50
        ? 50 + (100 - bg.lightness) * 0.3
        : 25 + bg.lightness * 0.3;

    const targetChroma = Math.max(origChroma * 1.2, 20);
    const targetA = Math.cos(hue) * targetChroma;
    const targetB = Math.sin(hue) * targetChroma;

    const newColor = new Color([targetL, targetA, targetB], "lab");
    return newColor;
  }

  /**
   * 현재 fillStyle이 제거할 배경색인지 확인
   */
  shouldSkipFill() {
    // 배경색 제거 기능이 비활성화되어 있으면 건너뛰지 않음
    if (!this.removeBackgroundColors) {
      return false;
    }

    const currentFillStyle = this.ctx.fillStyle;
    if (typeof currentFillStyle !== "string") {
      return false;
    }

    // 색상을 정규화하여 비교
    const normalizedColor = this.normalizeColor(currentFillStyle);

    // 디버깅: 모든 fillStyle 로깅 (개발 모드에서만)
    if (this.debugMode && typeof window !== "undefined" && window.console) {
      window.console.log(
        `[DEBUG] fillStyle 감지: ${currentFillStyle} -> ${normalizedColor}`
      );
    }

    // 1. 정확한 색상 매칭 (문자열 비교)
    for (const bgColor of this.backgroundColorsToRemove) {
      const normalizedBgColor = this.normalizeColor(bgColor);
      if (normalizedColor === normalizedBgColor) {
        if (this.debugMode && typeof window !== "undefined" && window.console) {
          window.console.log(
            `[DEBUG] 정확한 색상 매칭으로 제거: ${normalizedColor}`
          );
        }
        return true;
      }
    }

    // 2. 유사한 색상 비교 (더 낮은 임계값으로)
    for (const bgColor of this.backgroundColorsToRemove) {
      if (this.isSimilarColor(normalizedColor, bgColor, 10)) {
        // 임계값을 15에서 10으로 낮춤
        if (this.debugMode && typeof window !== "undefined" && window.console) {
          window.console.log(
            `[DEBUG] 유사한 색상으로 제거: ${normalizedColor} ≈ ${bgColor}`
          );
        }
        return true;
      }
    }

    // 3. HSL 기반 노란색 감지 (색조각도 45-75도 범위)
    try {
      const color = new Color(normalizedColor);
      const hue = this.getHue(color);

      // 노란색 계열 감지 (색조각도 45-75도, 채도 30% 이상, 밝기 70% 이상)
      if (
        hue >= 45 &&
        hue <= 75 &&
        color.chroma >= 30 &&
        color.lightness >= 70
      ) {
        if (this.debugMode && typeof window !== "undefined" && window.console) {
          window.console.log(
            `[DEBUG] HSL 노란색 감지로 제거: ${normalizedColor} (H: ${hue.toFixed(1)}, C: ${color.chroma.toFixed(1)}, L: ${color.lightness.toFixed(1)})`
          );
        }
        return true;
      }

      // 4. 밝기가 높은 색상도 배경색으로 간주
      if (
        color.lightness > this.backgroundLightnessThreshold &&
        color.chroma < this.backgroundChromaThreshold
      ) {
        if (this.debugMode && typeof window !== "undefined" && window.console) {
          window.console.log(
            `[DEBUG] 밝은 배경색 감지하여 제거: ${normalizedColor} (L: ${color.lightness.toFixed(1)}, C: ${color.chroma.toFixed(1)})`
          );
        }
        return true;
      }
    } catch (error) {
      // 색상 파싱 실패 시 무시
      if (this.debugMode && typeof window !== "undefined" && window.console) {
        window.console.warn(
          `[DEBUG] 색상 파싱 실패: ${normalizedColor}`,
          error
        );
      }
    }

    return false;
  }

  /**
   * 색상의 색조각도를 계산 (0-360도)
   */
  getHue(color) {
    const [r, g, b] = color.rgb;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    if (delta === 0) {
      return 0;
    }

    let hue = 0;
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }

    hue = Math.round(hue * 60);
    if (hue < 0) {
      hue += 360;
    }

    return hue;
  }

  /**
   * 색상을 hex 형태로 정규화
   */
  normalizeColor(colorStr) {
    if (!colorStr || typeof colorStr !== "string") {
      return "";
    }

    const str = colorStr.trim();

    if (str.startsWith("#")) {
      const hex = str.toUpperCase();
      // 3자리 hex를 6자리로 확장
      if (hex.length === 4) {
        return "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
      }
      return hex;
    }

    // rgb() 또는 rgba() 형태 처리
    if (str.startsWith("rgb")) {
      try {
        const color = new Color(str);
        return color.hex.toUpperCase();
      } catch {
        // 파싱 실패 시 원본 반환
        return str.toUpperCase();
      }
    }

    // 색상 이름 처리 (yellow, red 등)
    const colorNames = {
      yellow: "#FFFF00",
      gold: "#FFD700",
      lightyellow: "#FFFFE0",
      lemonchiffon: "#FFFACD",
      lightgoldenrodyellow: "#FAFAD2",
      papayawhip: "#FFEFD5",
      moccasin: "#FFE4B5",
      peachpuff: "#FFDAB9",
      palegoldenrod: "#EEE8AA",
      khaki: "#F0E68C",
      darkkhaki: "#BDB76B",
    };

    const lowerStr = str.toLowerCase();
    if (colorNames[lowerStr]) {
      return colorNames[lowerStr];
    }

    return str.toUpperCase();
  }

  /**
   * 두 색상이 비슷한지 확인
   */
  isSimilarColor(color1, color2, threshold = 15) {
    if (!color1 || !color2) {
      return false;
    }

    // 정확히 일치하는 경우
    if (color1 === color2) {
      return true;
    }

    try {
      const c1 = new Color(color1);
      const c2 = new Color(color2);

      // Lab 색공간에서 색상 차이 계산 (더 정확한 색상 비교)
      const deltaE = c1.deltaE(c2);

      // RGB 거리도 계산해서 추가 비교
      const [r1, g1, b1] = c1.rgb.map(x => x * 255);
      const [r2, g2, b2] = c2.rgb.map(x => x * 255);
      const rgbDistance = Math.hypot(r1 - r2, g1 - g2, b1 - b2);

      // deltaE 또는 RGB 거리 중 하나라도 임계값보다 작으면 유사한 색상으로 판단
      return deltaE < threshold || rgbDistance < threshold * 10;
    } catch {
      // 색상 파싱 실패 시 문자열 비교
      return color1 === color2;
    }
  }
}

export { Blender };
