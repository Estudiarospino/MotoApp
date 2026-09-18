import Image from "next/image";

export function HeroBanner({ nombre }: { nombre: string }) {
  return (
    <>
      {/* Móvil: saludo en texto plano + franja oscura compacta con la moto */}
      <div className="flex flex-col gap-4 sm:hidden">
        <div>
          <h1 className="text-xl font-bold text-foreground">¡Bienvenido, {nombre}!</h1>
          <p className="mt-1 text-sm text-muted-foreground">Aquí tienes el resumen general de tu negocio.</p>
        </div>

        <div className="relative flex h-[110px] items-center overflow-hidden rounded-2xl bg-[linear-gradient(115deg,#0f1b2e_0%,#16233d_45%,#1d3a6b_100%)] px-5">
          <p className="relative z-10 max-w-[55%] text-sm leading-snug font-medium text-white/85">
            Más que arriendo,
            <br />
            <span className="text-base font-bold text-white">mueve tus sueños</span>
          </p>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-[58%]">
            <Image
              src="/images/moto-banner.png"
              alt="Motocicleta MotoGestión"
              fill
              sizes="60vw"
              className="object-contain object-right drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)]"
              priority
            />
          </div>
        </div>
      </div>

      {/* Escritorio: tarjeta única con saludo y moto integrados */}
      <div className="relative hidden min-h-[190px] items-center justify-between overflow-hidden rounded-2xl bg-[linear-gradient(115deg,#0f1b2e_0%,#16233d_45%,#1d3a6b_100%)] px-6 py-7 sm:flex sm:px-8">
        <div className="relative z-10 max-w-md">
          <p className="text-xs font-semibold tracking-wider text-white/50 uppercase">Panel de control</p>
          <h1 className="mt-1.5 text-2xl font-bold text-white sm:text-3xl">¡Bienvenido, {nombre}!</h1>
          <p className="mt-1.5 text-sm text-white/70">Aquí tienes el resumen general de tu negocio.</p>
        </div>

        <p className="absolute top-5 right-7 z-10 hidden max-w-[170px] text-right text-sm leading-snug font-medium text-white/85 lg:block">
          Más que arriendo,
          <br />
          <span className="text-lg font-bold text-white">mueve tus sueños</span>
        </p>

        <div className="pointer-events-none absolute top-10 right-0 bottom-0 hidden w-[62%] sm:block">
          <Image
            src="/images/moto-banner.png"
            alt="Motocicleta MotoGestión"
            fill
            sizes="(min-width: 640px) 50vw, 0px"
            className="object-contain object-right drop-shadow-[0_18px_28px_rgba(0,0,0,0.45)]"
            priority
          />
        </div>
      </div>
    </>
  );
}
