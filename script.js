const $ = (id) => document.getElementById(id);
const form = $("promptForm");
const upload = $("referencePhotos");
const previewGrid = $("previewGrid");
let chosenFiles = [];

upload.addEventListener("change", () => {
  chosenFiles = Array.from(upload.files || []);
  renderPreviews();
});

function renderPreviews() {
  previewGrid.innerHTML = "";
  chosenFiles.forEach((file, index) => {
    const card = document.createElement("div");
    card.className = "preview-card";
    const img = document.createElement("img");
    img.alt = `Prévia da referência ${index + 1}`;
    img.src = URL.createObjectURL(file);
    const label = document.createElement("label");
    label.textContent = `Pessoa / referência ${index + 1}`;
    const input = document.createElement("input");
    input.type = "text";
    input.className = "role-input";
    input.value = defaultRole(index);
    input.placeholder = "Ex.: pai, mãe, personagem 1";
    input.setAttribute("aria-label", `Identificação da referência ${index + 1}`);
    label.appendChild(input);
    card.append(img, label);
    previewGrid.appendChild(card);
  });
}

function defaultRole(index) {
  const type = $("creationType").value;
  if (type === "composition") return index === 0 ? "Pessoa cuja identidade deve ser preservada" : index === 1 ? "Foto de destino / cenário" : `Referência ${index + 1}`;
  if (type === "family") return ["Pai","Mãe","Filho(a) 1","Filho(a) 2"][index] || `Familiar ${index + 1}`;
  if (type === "couple") return index === 0 ? "Pessoa 1 do casal" : index === 1 ? "Pessoa 2 do casal" : `Pessoa ${index + 1}`;
  return `Personagem ${index + 1}`;
}
$("creationType").addEventListener("change", () => {
  document.querySelectorAll(".role-input").forEach((input, index) => {
    if (!input.dataset.edited) input.value = defaultRole(index);
  });
});
previewGrid.addEventListener("input", (event) => {
  if (event.target.classList.contains("role-input")) event.target.dataset.edited = "true";
});

function val(id) { return ($(id).value || "").trim(); }
function sentence(label, value) { return value ? `${label}: ${value}.` : ""; }
function makePrompt() {
  const roles = Array.from(document.querySelectorAll(".role-input")).map((input, i) =>
    `Reference ${i + 1} (${input.value.trim() || `Character ${i + 1}`}): use this image according to the selected reference mode.`
  );
  const creationNames = {
    single: "a single person or character",
    couple: "a couple",
    family: "a family",
    group: "a group of people",
    composition: "a composition that places the person from the first reference into the second reference image"
  };
  const profileNames = {
    masculine: "masculine presentation",
    feminine: "feminine presentation",
    child: "a child, with age-appropriate clothing, accessories, pose, and setting",
    mixed: "a group with varied appearances and presentations",
    other: "the presentation specified by the references and user description"
  };
  const identity = {
    strict: "Preserve each referenced person's recognizable identity as faithfully as possible: facial proportions, face shape, eyes, nose, lips, eyebrows, skin tone, hairline, hairstyle, and distinctive features. Do not blend identities or invent facial changes.",
    balanced: "Keep each referenced person's recognizable facial identity and distinctive features while adapting lighting, pose, and perspective naturally to the new scene.",
    inspired: "Use the references as visual inspiration while allowing reasonable creative adaptation."
  };
  const refMode = {
    identity: "Treat uploaded photos as identity references for the labeled people.",
    style: "Treat uploaded photos as visual references for appearance, styling, and mood.",
    composition: "Use the first reference as the main person and the second reference as the destination scene/composition when both are supplied."
  };

  const clothing = val("customClothing") || val("clothing");
  const team = val("teamName") ? `${val("teamCountry") ? val("teamCountry") + " " : ""}${val("teamName")}` : "";
  const jersey = [team ? `Team or jersey identity: ${team}` : "", val("jerseyDetails") ? `Jersey details: ${val("jerseyDetails")}` : ""].filter(Boolean).join(". ");
  const tattoo = val("tattoos") === "no visible tattoos" ? "No visible tattoos" : `${val("tattoos")}; style: ${val("tattooStyle")}${val("tattooText") ? `; exact requested lettering: "${val("tattooText")}"` : ""}`;
  const scene = val("customScene") || val("scene");
  const pose = val("customPose") || val("pose");
  const accessories = [val("necklace"), val("watch"), val("accessories"), val("accessoryDetails")].filter(Boolean).join("; ");
  const extras = val("extraDetails");
  const idea = val("idea");
  const sections = [
    `Create ${creationNames[val("creationType")] || "a realistic photograph"} in ${val("photoStyle")}.`,
    `Subject profile: ${profileNames[val("profile")] || "as specified"}.`,
    roles.length ? `REFERENCE IMAGE ROLES: ${roles.join(" ")}` : "No reference photos were uploaded; follow the written description.",
    refMode[val("referenceMode")] || "",
    identity[val("identityStrength")] || "",
    idea ? `MAIN CREATIVE IDEA: ${idea}.` : "",
    `WARDROBE: ${clothing}. ${jersey}`,
    `BODY AND APPEARANCE: ${val("bodyType")}. Keep realistic anatomy, natural body proportions, believable posture, and coherent skin tone.`,
    `TATTOOS: ${tattoo}.`,
    `ACCESSORIES: ${accessories}.`,
    `SCENE: ${scene}.`,
    `POSE AND INTERACTION: ${pose}.`,
    `FACIAL EXPRESSION: ${val("expression")}.`,
    `FRAMING: ${val("framing")}. Keep the composition intentional and ensure the main subject is clearly visible.`,
    `LIGHTING: ${val("lighting")}. Use physically plausible light direction, natural shadows, realistic reflections, and balanced exposure.`,
    `CAMERA: ${val("camera")}. Professional photographic composition, accurate perspective, natural depth of field, sharp focus on the subject, and a believable background.`,
    `REALISM AND TEXTURE: ${val("realism")}. Detailed natural skin texture with pores and subtle imperfections, realistic eyes and catchlights, individual hair strands, accurate fabric weave and folds, authentic material response, detailed accessories, realistic hands with five correctly formed fingers, and consistent anatomy.`,
    extras ? `ADDITIONAL DETAILS: ${extras}.` : "",
    `COLOR AND FINISH: rich but natural colors, realistic contrast, high dynamic range without artificial overprocessing, high-resolution detail, editorial-quality finish.`,
    `NEGATIVE CONSTRAINTS: no face swapping between different people, no identity blending, no distorted facial features, no asymmetrical or malformed eyes, no extra fingers or limbs, no fused hands, no duplicated people, no floating objects, no plastic or waxy skin, no excessive beauty filters, no cartoon or game-render appearance unless specifically requested, no random text, no watermarks, no logos or sponsors presented as perfectly accurate unless supplied as a clear reference.`,
    `FINAL REQUIREMENT: the result should look like a convincing real photograph, with consistent perspective, lighting, shadows, body proportions, and contact between people and objects. Keep the people distinct and follow the role labels above.`
  ].filter(Boolean);
  return sections.join("\n\n").replace(/\n{3,}/g, "\n\n");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  $("outputPrompt").value = makePrompt();
  $("copyStatus").textContent = "Prompt criado. Revise e copie quando quiser.";
  $("outputPrompt").scrollIntoView({ behavior: "smooth", block: "center" });
});

$("copyButton").addEventListener("click", async () => {
  const text = $("outputPrompt").value.trim();
  if (!text) {
    $("copyStatus").textContent = "Crie o prompt antes de copiar.";
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    $("copyStatus").textContent = "Prompt copiado!";
  } catch (err) {
    $("outputPrompt").focus();
    $("outputPrompt").select();
    $("copyStatus").textContent = "Selecione o texto e use Copiar no menu do celular.";
  }
});

$("clearButton").addEventListener("click", () => {
  if (!confirm("Quer limpar os campos e remover as prévias das fotos?")) return;
  form.reset();
  chosenFiles.forEach(() => {});
  chosenFiles = [];
  previewGrid.innerHTML = "";
  $("outputPrompt").value = "";
  $("copyStatus").textContent = "";
  upload.value = "";
});
