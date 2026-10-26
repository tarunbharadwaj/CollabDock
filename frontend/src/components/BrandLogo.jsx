export function BrandLogo({ className = '', compact = false, title = 'CollabDock' }) {
  return (
    <svg
      className={`brand-logo ${compact ? 'brand-logo-compact' : ''} ${className}`.trim()}
      viewBox={compact ? '774 24 104 106' : '0 0 900 256'}
      role="img"
      aria-label={title}
      focusable="false"
    >
      {!compact && <>
        <text x="24" y="165" fill="currentColor" fontFamily="Georgia, Times New Roman, serif" fontSize="122" fontWeight="700" fontStyle="italic" letterSpacing="-8">Collab</text>
        <text x="428" y="164" fill="currentColor" fontFamily="Arial Black, Segoe UI Black, Arial, sans-serif" fontSize="104" fontWeight="900" letterSpacing="-7">DOCK</text>
        <path d="M422 186H854" stroke="#5360FF" strokeWidth="16"/>
      </>}
      <path fill="#FF4FA3" d="M820 34L830 57L854 48L844 71L868 81L842 87L849 113L828 98L812 120L811 94L784 95L803 77L785 58L811 63Z"/>
    </svg>
  );
}
