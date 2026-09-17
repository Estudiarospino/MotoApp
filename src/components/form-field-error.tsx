export function FormFieldError({ mensajes }: { mensajes?: string[] }) {
  if (!mensajes?.length) return null;
  return <p className="text-xs text-red-600">{mensajes[0]}</p>;
}
