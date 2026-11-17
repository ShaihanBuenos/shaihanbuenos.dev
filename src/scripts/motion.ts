// The motion "Traçado" (DESIGN.md, Motion), on the pages that have the plan
// or sections: the name letter by letter and the traces of the opening, the
// reveal of the sections and the progress bar. The CSS does the animating,
// in opening.css and scroll.css; this file gives it what CSS cannot find out
// by itself. The reading pages do not load it.

const root = document.documentElement;

// ---------- the name, letter by letter ----------

// Puts each letter of the name in an element of its own, for the CSS to show
// them one after the other. A screen reader keeps reading the name whole.
function spellName(): void {
  const name = document.querySelector<HTMLElement>(".core h1");
  // Until this runs, the CSS holds the whole name back for a moment. If the
  // name is already showing, it stays as it is instead of starting over.
  if (!name || getComputedStyle(name).opacity !== "0") return;

  const letters = document.createElement("span");
  letters.ariaHidden = "true";
  let index = 0;
  for (const node of name.childNodes) {
    if (node.nodeName === "BR") letters.append(document.createElement("br"));
    for (const letter of (node.textContent ?? "").trim()) {
      const element = document.createElement("span");
      element.className = "letter";
      element.style.setProperty("--i", String(index++));
      element.textContent = letter;
      letters.append(element);
    }
  }
  name.ariaLabel = name.textContent.replace(/\s+/g, " ").trim();
  name.replaceChildren(letters);
}

// ---------- the traces ----------

// A trace goes from the frame to a block, or from a block to another: the
// delay of its drawing in the opening, in ms, the tone of its pulse and its
// points, each one a [column, row] of the grid of the plan.
type Trace = [delay: number, tone: "copper" | "sapphire", ...points: [number, number][]];

// The plan of the phone, 10 columns by 22 rows, has traces of its own.
const PHONE: Trace[] = [
  [0, "copper", [9.5, 0], [9.5, 9]], // the top of the frame to research
  [250, "sapphire", [0, 10.5], [1.5, 10.5], [1.5, 12]], // the left of the frame to method
  [450, "copper", [10, 14], [7.5, 14], [7.5, 15]], // the right of the frame to experience
  [650, "copper", [0, 17], [1, 17], [1, 18]], // the left of the frame to the projects
  [350, "sapphire", [2, 12], [2, 11], [3, 11]], // method to research
];

// The plan of the computer, 26 columns by 16 rows.
const COMPUTER: Trace[] = [
  [0, "copper", [20, 0], [20, 1]], // the top of the frame to research
  [100, "sapphire", [0, 5], [1, 5]], // the left of the frame to the core
  [200, "copper", [26, 3], [25, 3]], // the right of the frame to research
  [350, "sapphire", [12, 16], [12, 12.5], [13, 12.5], [13, 12]], // the bottom of the frame to method
  [500, "copper", [0, 12], [1, 12]], // the left of the frame to experience
  [650, "copper", [20.5, 16], [20.5, 15]], // the bottom of the frame to the projects
  [750, "sapphire", [19, 8], [20, 8]], // method to the projects
  [600, "copper", [11, 11.5], [13, 11.5]], // experience to method
];

function shape(name: string, className: string): SVGElement {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);
  element.setAttribute("class", className);
  return element;
}

// Draws the traces over the plan, in pixels: a trace is a line of 1.5px, and
// its pulse a dash of 14px, whatever the size of a cell of the grid.
function routeTraces(): void {
  const plan = document.querySelector<HTMLElement>(".plan");
  if (!plan) return;

  const draw = () => {
    plan.querySelector(".traces")?.remove();
    const columns = getComputedStyle(plan).gridTemplateColumns.split(" ").length;
    const [traces, rows] = columns > 10 ? [COMPUTER, 16] : [PHONE, 22];
    const u = plan.clientWidth / columns;
    const v = plan.clientHeight / rows;

    // The traces are decoration: they stay out of the reading of the page.
    const svg = shape("svg", "traces");
    svg.ariaHidden = "true";
    for (const [delay, tone, ...points] of traces) {
      let length = 0;
      let [x, y] = [0, 0];
      const line = points.map(([column, row], index) => {
        const [fromX, fromY] = [x, y];
        [x, y] = [column * u, row * v];
        if (index > 0) length += Math.abs(x - fromX) + Math.abs(y - fromY);
        return `${x.toFixed(1)} ${y.toFixed(1)}`;
      });

      for (const className of ["trace", `pulse ${tone}`]) {
        const path = shape("path", className);
        path.setAttribute("d", `M${line.join("L")}`);
        path.style.setProperty("--length", `${length.toFixed(1)}px`);
        path.style.setProperty("--delay", `${delay}ms`);
        svg.append(path);
      }

      // The node: a square of 7px where the trace arrives.
      const node = shape("rect", "node");
      node.setAttribute("x", String(x - 3.5));
      node.setAttribute("y", String(y - 3.5));
      node.setAttribute("width", "7");
      node.setAttribute("height", "7");
      node.style.setProperty("--delay", `${delay + 650}ms`);
      svg.append(node);
    }
    plan.append(svg);
  };

  // The traces follow the plan when it changes size.
  let size = "";
  new ResizeObserver(() => {
    const now = `${plan.clientWidth}x${plan.clientHeight}`;
    if (now !== size) {
      size = now;
      draw();
    }
  }).observe(plan);
}

// ---------- the scroll ----------

// Marks each section the first time it enters the screen.
function revealSections(): void {
  const entering = new IntersectionObserver(
    (entries) => {
      for (const { isIntersecting, target } of entries) {
        if (!isIntersecting) continue;
        target.classList.add("seen");
        entering.unobserve(target);
      }
    },
    { rootMargin: "0px 0px -12% 0px" },
  );
  for (const section of document.querySelectorAll(".section")) entering.observe(section);
}

// Tells the progress bar how far the page has scrolled, from 0 to 1.
function followScroll(): void {
  let waiting = false;
  const update = () => {
    waiting = false;
    const most = root.scrollHeight - innerHeight;
    const progress = most > 0 ? Math.min(1, scrollY / most) : 0;
    root.style.setProperty("--progress", progress.toFixed(4));
  };
  addEventListener(
    "scroll",
    () => {
      if (waiting) return;
      waiting = true;
      requestAnimationFrame(update);
    },
    { passive: true },
  );
  update();
}

// ---------- the switch ----------

// iOS only shows the state of a touched block of the plan (:active) on a
// page that listens to touches. This is not motion, so it does not wait for
// the switch.
addEventListener("touchstart", () => undefined, { passive: true });

// The switch is the class "motion", which Motion.astro puts on the page
// before it shows, unless the system asks for reduced motion. Without the
// class nothing starts.
if (root.classList.contains("motion")) {
  spellName();
  routeTraces();
  revealSections();
  followScroll();
}
