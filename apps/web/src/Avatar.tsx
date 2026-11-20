import { initialsFromName, personaById } from "@hotpot/engine";

function BotPortrait({ id }: { id: string }) {
  switch (id) {
    /* Tibo — 冷静赤狐 */
    case "claude":
      return (
        <svg viewBox="0 0 40 40" aria-hidden>
          <rect width="40" height="40" fill="#B75C43" />
          <circle cx="20" cy="14" r="16" fill="#C97057" opacity="0.45" />
          <path d="M9.5 19.5 L11.5 8.2 L18.2 14.4 Z" fill="#DA704F" />
          <path d="M11.3 16.8 L12.5 10.9 L16.2 14.3 Z" fill="#FFF4E8" />
          <path d="M30.5 19.5 L28.5 8.2 L21.8 14.4 Z" fill="#DA704F" />
          <path d="M28.7 16.8 L27.5 10.9 L23.8 14.3 Z" fill="#FFF4E8" />
          <path
            d="M9.2 20.2 C9.2 14 14 11.8 20 11.8 C26 11.8 30.8 14 30.8 20.2 C30.8 26.6 24.2 31.4 20 32.5 C15.8 31.4 9.2 26.6 9.2 20.2 Z"
            fill="#DA704F"
          />
          <path
            d="M9.2 20.8 C9.8 26.3 15.6 31.2 20 32.5 C19.5 27 15.8 23.2 9.2 20.8 Z"
            fill="#FFF7EE"
          />
          <path
            d="M30.8 20.8 C30.2 26.3 24.4 31.2 20 32.5 C20.5 27 24.2 23.2 30.8 20.8 Z"
            fill="#FFF7EE"
          />
          <circle cx="15.3" cy="21.4" r="1.65" fill="#261A16" />
          <circle cx="24.7" cy="21.4" r="1.65" fill="#261A16" />
          <circle cx="14.8" cy="20.8" r="0.52" fill="#FFFFFF" />
          <circle cx="24.2" cy="20.8" r="0.52" fill="#FFFFFF" />
          <path d="M18.1 28.3 Q20 27.3 21.9 28.3 L20 30.8 Z" fill="#261A16" />
        </svg>
      );

    /* Linus — 镜框猫头鹰 */
    case "gpt":
      return (
        <svg viewBox="0 0 40 40" aria-hidden>
          <rect width="40" height="40" fill="#21725C" />
          <circle cx="20" cy="14" r="16" fill="#2F8A71" opacity="0.42" />
          <path d="M10.2 15.5 L11.4 9.2 L16.2 12.6 Z" fill="#358C74" />
          <path d="M29.8 15.5 L28.6 9.2 L23.8 12.6 Z" fill="#358C74" />
          <circle cx="20" cy="22.4" r="11.4" fill="#358C74" />
          <circle cx="15.2" cy="21.2" r="5.9" fill="#F2F7F4" />
          <circle cx="24.8" cy="21.2" r="5.9" fill="#F2F7F4" />
          <ellipse cx="20" cy="25.6" rx="7.2" ry="5.8" fill="#F2F7F4" />
          <circle cx="15.2" cy="20.8" r="4" fill="none" stroke="#1E302A" strokeWidth="1.5" />
          <circle cx="24.8" cy="20.8" r="4" fill="none" stroke="#1E302A" strokeWidth="1.5" />
          <path d="M19.2 20.8 H20.8" stroke="#1E302A" strokeWidth="1.5" />
          <circle cx="15.2" cy="20.8" r="1.65" fill="#1E302A" />
          <circle cx="24.8" cy="20.8" r="1.65" fill="#1E302A" />
          <circle cx="14.7" cy="20.2" r="0.52" fill="#FFFFFF" />
          <circle cx="24.3" cy="20.2" r="0.52" fill="#FFFFFF" />
          <path d="M18.3 23.6 L21.7 23.6 L20 27.1 Z" fill="#E3A545" />
        </svg>
      );

    /* Aqua — 月下小鲸 */
    case "kimi":
      return (
        <svg viewBox="0 0 40 40" aria-hidden>
          <rect width="40" height="40" fill="#304554" />
          <circle cx="16" cy="14" r="16" fill="#415C70" opacity="0.4" />
          <path
            d="M28.2 7.4 A4.7 4.7 0 1 0 32.4 13.8 A3.8 3.8 0 1 1 28.2 7.4 Z"
            fill="#F5ECD7"
          />
          <circle cx="12" cy="11.5" r="0.9" fill="#F5ECD7" opacity="0.65" />
          <path
            d="M7.8 25 C7.8 17.5 13.5 14.5 20.4 15.8 C25.2 16.8 27.8 20.2 28.4 24.1 C30.8 23.4 32.6 21.3 33.4 18.8 C34 22.4 32.2 25.5 29.2 26.4 C31 27.7 32 29.2 31.6 30.8 C29 29.9 27.2 28.4 26.4 27.2 C23.6 28.7 19.2 29.4 14.2 28.9 C10.1 28.5 7.8 27.1 7.8 25 Z"
            fill="#80A7BE"
          />
          <path
            d="M8.5 25.2 C12.2 24.4 17.4 24.6 22.8 26.2 C20 28.7 14.8 29.2 10.9 28.1 C9.1 27.5 8.4 26.4 8.5 25.2 Z"
            fill="#EFF5F8"
          />
          <circle cx="14.2" cy="21.5" r="1.45" fill="#1C2B35" />
          <circle cx="13.7" cy="21" r="0.45" fill="#FFFFFF" />
          <path
            d="M7 32.2 Q13.5 30.2 20 32 T33 31.6"
            fill="none"
            stroke="#EEF5F8"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.28"
          />
        </svg>
      );

    /* Alice — 雾蓝小猫 */
    case "glm":
      return (
        <svg viewBox="0 0 40 40" aria-hidden>
          <rect width="40" height="40" fill="#385E8F" />
          <circle cx="20" cy="14" r="16" fill="#4B74A8" opacity="0.42" />
          <path d="M10.4 18.8 L11.4 9 L18.4 14 Z" fill="#FAF7F2" />
          <path d="M12.1 16.4 L12.7 11.4 L16.7 14.2 Z" fill="#E8A99E" />
          <path d="M29.6 18.8 L28.6 9 L21.6 14 Z" fill="#FAF7F2" />
          <path d="M27.9 16.4 L27.3 11.4 L23.3 14.2 Z" fill="#E8A99E" />
          <ellipse cx="20" cy="22.8" rx="10.6" ry="9.1" fill="#FAF7F2" />
          <path
            d="M18.1 14 L18.8 16.8 M20 13.7 V17.1 M21.9 14 L21.2 16.8"
            stroke="#5980B3"
            strokeWidth="1.35"
            strokeLinecap="round"
          />
          <circle cx="15.5" cy="22.1" r="1.6" fill="#1F2A38" />
          <circle cx="24.5" cy="22.1" r="1.6" fill="#1F2A38" />
          <circle cx="15" cy="21.5" r="0.5" fill="#FFFFFF" />
          <circle cx="24" cy="21.5" r="0.5" fill="#FFFFFF" />
          <path d="M18.8 24.8 L21.2 24.8 L20 26.3 Z" fill="#D9827C" />
          <path
            d="M17.6 27.3 Q18.8 28.4 20 27.2 Q21.2 28.4 22.4 27.3"
            fill="none"
            stroke="#3C4E63"
            strokeWidth="1.15"
            strokeLinecap="round"
          />
          <path
            d="M7.5 23.2 L11.4 23.8 M7.8 25.8 L11.5 25.4 M32.5 23.2 L28.6 23.8 M32.2 25.8 L28.5 25.4"
            stroke="#1F2A38"
            strokeWidth="0.95"
            strokeLinecap="round"
            opacity="0.32"
          />
        </svg>
      );

    /* Seth — 纸折雨燕 */
    case "qwen":
      return (
        <svg viewBox="0 0 40 40" aria-hidden>
          <rect width="40" height="40" fill="#5E4F8C" />
          <circle cx="20" cy="14" r="16" fill="#7363A6" opacity="0.4" />
          <path d="M19.5 19.2 L11 10.4 L22.5 15.6 Z" fill="#D4CDE8" />
          <path d="M8.5 26.8 L16.2 21.4 L28.8 14.8 L23.2 24 L15.6 25.6 L11.4 30.2 L13.9 24.6 Z" fill="#FAF9FC" />
          <path d="M17.2 21.2 L25 9.4 L24.2 20.6 Z" fill="#EAE5F6" />
          <path d="M28.2 14.8 L32.4 14.2 L28.6 17 Z" fill="#E4A94C" />
          <circle cx="26.1" cy="16.5" r="1.1" fill="#2A2240" />
        </svg>
      );

    /* Nori — 狡黠小浣熊 */
    case "grok":
      return (
        <svg viewBox="0 0 40 40" aria-hidden>
          <rect width="40" height="40" fill="#3B4148" />
          <circle cx="20" cy="14" r="16" fill="#4E565F" opacity="0.4" />
          <circle cx="11.6" cy="13" r="3.8" fill="#DCE0DF" />
          <circle cx="11.6" cy="13" r="2" fill="#272C32" />
          <circle cx="28.4" cy="13" r="3.8" fill="#DCE0DF" />
          <circle cx="28.4" cy="13" r="2" fill="#272C32" />
          <path
            d="M9.2 21.8 C9.2 14.8 14 12 20 12 C26 12 30.8 14.8 30.8 21.8 C30.8 27.6 25.6 31.2 20 31.2 C14.4 31.2 9.2 27.6 9.2 21.8 Z"
            fill="#EAEFED"
          />
          <ellipse cx="14.8" cy="21.2" rx="4.7" ry="3.4" transform="rotate(-14 14.8 21.2)" fill="#24292E" />
          <ellipse cx="25.2" cy="21.2" rx="4.7" ry="3.4" transform="rotate(14 25.2 21.2)" fill="#24292E" />
          <circle cx="15.2" cy="21.1" r="1.85" fill="#FFFFFF" />
          <circle cx="24.8" cy="21.1" r="1.85" fill="#FFFFFF" />
          <circle cx="15.4" cy="21.2" r="1.15" fill="#1E2328" />
          <circle cx="24.6" cy="21.2" r="1.15" fill="#1E2328" />
          <ellipse cx="20" cy="26.6" rx="4.7" ry="3.4" fill="#FFFFFF" />
          <ellipse cx="20" cy="25.2" rx="2.1" ry="1.4" fill="#24292E" />
          <path
            d="M18.3 27.5 Q20 28.6 21.7 27.5"
            fill="none"
            stroke="#24292E"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </svg>
      );

    /* Milo — 元气柴犬 */
    case "gemini":
      return (
        <svg viewBox="0 0 40 40" aria-hidden>
          <rect width="40" height="40" fill="#6A5692" />
          <circle cx="20" cy="14" r="16" fill="#7E68AA" opacity="0.4" />
          <path d="M10.4 18.2 L11.5 8.8 L18.1 13.6 Z" fill="#DE9649" />
          <path d="M12.1 16.2 L12.7 11.4 L16.5 14 Z" fill="#FFF3E0" />
          <path d="M29.6 18.2 L28.5 8.8 L21.9 13.6 Z" fill="#DE9649" />
          <path d="M27.9 16.2 L27.3 11.4 L23.5 14 Z" fill="#FFF3E0" />
          <ellipse cx="20" cy="22.6" rx="10.7" ry="9.4" fill="#E39D4F" />
          <path
            d="M10.2 23.4 C11.6 20.6 15.6 21.5 18.2 23.2 L20 21.4 L21.8 23.2 C24.4 21.5 28.4 20.6 29.8 23.4 C29.4 28.4 25 32 20 32 C15 32 10.6 28.4 10.2 23.4 Z"
            fill="#FFF7EB"
          />
          <ellipse cx="16.1" cy="17.7" rx="1.45" ry="0.95" fill="#FFF7EB" />
          <ellipse cx="23.9" cy="17.7" rx="1.45" ry="0.95" fill="#FFF7EB" />
          <circle cx="15.5" cy="21.5" r="1.6" fill="#261C18" />
          <circle cx="24.5" cy="21.5" r="1.6" fill="#261C18" />
          <circle cx="15" cy="20.9" r="0.5" fill="#FFFFFF" />
          <circle cx="24" cy="20.9" r="0.5" fill="#FFFFFF" />
          <ellipse cx="20" cy="24.7" rx="1.95" ry="1.35" fill="#261C18" />
          <path
            d="M17.8 27 Q20 28.8 22.2 27"
            fill="none"
            stroke="#261C18"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      );

    /* Vera — 深海虎鲸 */
    case "deepseek":
      return (
        <svg viewBox="0 0 40 40" aria-hidden>
          <rect width="40" height="40" fill="#29566C" />
          <circle cx="20" cy="14" r="16" fill="#376C86" opacity="0.4" />
          <path
            d="M9.5 26.8 C10.5 20.2 15.2 14.8 21.5 14.2 L20 8.8 C23.6 9.8 25.5 12.6 25.8 14.8 C29.5 16.2 32 19.6 31.8 23 C31.6 25.6 28.6 27.6 24.4 27.8 C19.5 28 15.6 26.2 12.8 27.4 C11.4 29 9.5 29.5 8 29.2 C9 28.2 9.3 27.6 9.5 26.8 Z"
            fill="#142B38"
          />
          <path
            d="M15.8 25.2 C19.6 23.2 25.5 22.6 31.1 24.1 C29.8 26.6 26.8 27.8 23.6 27.9 C19.8 28 17.5 26.8 15.8 25.2 Z"
            fill="#F5F9FA"
          />
          <ellipse cx="24.2" cy="18.6" rx="2.9" ry="1.5" transform="rotate(-14 24.2 18.6)" fill="#F5F9FA" />
          <circle cx="27.2" cy="21.5" r="1.15" fill="#F5F9FA" />
          <circle cx="27.4" cy="21.5" r="0.65" fill="#142B38" />
          <path
            d="M8 32 Q14 29.8 20 31.6 T32 31.4"
            fill="none"
            stroke="#EBF4F7"
            strokeWidth="1.25"
            strokeLinecap="round"
            opacity="0.3"
          />
        </svg>
      );

    /* Juno — 红小熊猫 */
    case "minimax":
      return (
        <svg viewBox="0 0 40 40" aria-hidden>
          <rect width="40" height="40" fill="#8E4A5B" />
          <circle cx="20" cy="14" r="16" fill="#A65C6E" opacity="0.4" />
          <circle cx="11.6" cy="13.2" r="4.1" fill="#FFF4E6" />
          <circle cx="11.6" cy="13.2" r="2.4" fill="#5A2E25" />
          <circle cx="28.4" cy="13.2" r="4.1" fill="#FFF4E6" />
          <circle cx="28.4" cy="13.2" r="2.4" fill="#5A2E25" />
          <ellipse cx="20" cy="22.6" rx="10.7" ry="9.2" fill="#D16A43" />
          <ellipse cx="12.5" cy="24.8" rx="3.5" ry="2.6" fill="#FFF5E8" />
          <ellipse cx="27.5" cy="24.8" rx="3.5" ry="2.6" fill="#FFF5E8" />
          <ellipse cx="15.8" cy="17.6" rx="1.6" ry="1" fill="#FFF5E8" />
          <ellipse cx="24.2" cy="17.6" rx="1.6" ry="1" fill="#FFF5E8" />
          <path d="M14.2 22.8 L15.6 27.6 M25.8 22.8 L24.4 27.6" stroke="#6B3022" strokeWidth="2.1" strokeLinecap="round" opacity="0.6" />
          <ellipse cx="20" cy="26.2" rx="4.5" ry="3.4" fill="#FFF5E8" />
          <circle cx="15.8" cy="21.3" r="1.55" fill="#2B1915" />
          <circle cx="24.2" cy="21.3" r="1.55" fill="#2B1915" />
          <circle cx="15.3" cy="20.7" r="0.48" fill="#FFFFFF" />
          <circle cx="23.7" cy="20.7" r="0.48" fill="#FFFFFF" />
          <ellipse cx="20" cy="25" rx="1.95" ry="1.35" fill="#2B1915" />
          <path
            d="M18.2 27.3 Q20 28.6 21.8 27.3"
            fill="none"
            stroke="#2B1915"
            strokeWidth="1.15"
            strokeLinecap="round"
          />
        </svg>
      );

    /* Logan — 稳重林熊 */
    case "logan":
      return (
        <svg viewBox="0 0 40 40" aria-hidden>
          <rect width="40" height="40" fill="#546846" />
          <circle cx="20" cy="14" r="16" fill="#677E56" opacity="0.42" />
          <circle cx="11.6" cy="13.4" r="4.1" fill="#8C6040" />
          <circle cx="11.6" cy="13.4" r="2.1" fill="#EBD7BD" />
          <circle cx="28.4" cy="13.4" r="4.1" fill="#8C6040" />
          <circle cx="28.4" cy="13.4" r="2.1" fill="#EBD7BD" />
          <ellipse cx="20" cy="22.8" rx="10.9" ry="9.6" fill="#9E704D" />
          <ellipse cx="20" cy="25.8" rx="5.6" ry="4.4" fill="#F6EBDC" />
          <path
            d="M13.6 18.2 L16.8 18.7 M26.4 18.2 L23.2 18.7"
            stroke="#5C3D27"
            strokeWidth="1.35"
            strokeLinecap="round"
          />
          <circle cx="15.3" cy="20.7" r="1.55" fill="#231914" />
          <circle cx="24.7" cy="20.7" r="1.55" fill="#231914" />
          <circle cx="14.8" cy="20.2" r="0.48" fill="#FFFFFF" />
          <circle cx="24.2" cy="20.2" r="0.48" fill="#FFFFFF" />
          <ellipse cx="20" cy="24.3" rx="2.4" ry="1.65" fill="#2B1E17" />
          <path
            d="M20 25.9 V27.4 M18.1 27.6 Q20 28.7 21.9 27.6"
            fill="none"
            stroke="#2B1E17"
            strokeWidth="1.15"
            strokeLinecap="round"
          />
        </svg>
      );

    default:
      return null;
  }
}

export function Avatar({
  name,
  personaId,
  you,
  size = "md",
}: {
  name: string;
  personaId?: string;
  you?: boolean;
  size?: "sm" | "md";
}) {
  const persona = personaId ? personaById(personaId) : undefined;
  const bg = you ? "#1B6B52" : (persona?.color ?? "#4A5A54");
  const title = persona ? `${name} · ${persona.style.tagline}` : name;
  return (
    <div
      className={`avatar ${size === "sm" ? "avatar-sm" : ""} ${you ? "avatar-you" : ""} ${persona ? "avatar-bot" : ""}`}
      style={{ background: bg }}
      title={title}
    >
      {persona ? <BotPortrait id={persona.id} /> : <span>{initialsFromName(name)}</span>}
    </div>
  );
}
