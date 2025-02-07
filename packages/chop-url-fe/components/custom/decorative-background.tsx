/**
 * Decorative background component for the not found page.
 *
 * This component creates a decorative background with animated elements
 * to enhance the visual appeal of the not found page.
 *
 * @returns {React.ReactNode} The decorative background component.
 * @example
 * <div className="relative">
 *   <DecorativeBackground />
 *   <div className="relative">
 *     <h1>Not Found</h1>
 *   </div>
 * </div>
 */
function DecorativeBackground() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <div className="absolute -inset-[10px] bg-gradient-to-r from-[#FF0080]/5 via-[#7928CA]/5 to-[#FF0080]/5 dark:from-[#FF0080]/10 dark:via-[#7928CA]/10 dark:to-[#FF0080]/10 blur-2xl opacity-20 animate-gradient bg-300% pointer-events-none" />
      <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-[#FF0080]/10 dark:bg-[#FF0080]/20 rounded-full blur-2xl animate-blob pointer-events-none" />
      <div className="absolute top-1/3 -right-1/4 w-1/2 h-1/2 bg-[#7928CA]/10 dark:bg-[#7928CA]/20 rounded-full blur-2xl animate-blob animation-delay-2000 pointer-events-none" />
      <div className="absolute -bottom-1/4 left-1/3 w-1/2 h-1/2 bg-[#FF0080]/10 dark:bg-[#FF0080]/20 rounded-full blur-2xl animate-blob animation-delay-4000 pointer-events-none" />
    </div>
  );
}

export default DecorativeBackground;
