export function register() {
  const originalEmitWarning = process.emitWarning.bind(process);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (process as any).emitWarning = (warning: string | Error, ...args: unknown[]) => {
    const msg = typeof warning === 'string' ? warning : (warning as Error)?.message ?? '';
    if (msg.includes('DEP0169') || msg.includes('url.parse()')) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (originalEmitWarning as any)(warning, ...args);
  };
}
