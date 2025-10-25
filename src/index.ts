/**
 * Returns a greeting message
 * @param name - The name to greet
 * @returns A greeting message
 */
export function greet(name: string = 'World'): string {
  return `Hello, ${name}!`;
}

/**
 * Main function to demonstrate the library
 */
export function main(): void {
  console.log(greet('Research Gangsta'));
}

// Run main if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
