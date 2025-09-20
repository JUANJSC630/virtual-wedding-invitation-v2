const InvitationSection2 = () => {
  return (
    <section className="relative w-full flex flex-col items-center justify-center bg-white overflow-hidden p-0 m-0 ">
      {/* Hoja rasgada arriba */}
      <div
        className="w-full h-[100px] select-none pointer-events-none block"
        style={{
          maskImage: `url('/hoja-rasgada.png')`,
          WebkitMaskImage: `url('/hoja-rasgada.png')`,
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center bottom",
          WebkitMaskPosition: "center bottom",
          backgroundImage: `url('/fondo.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: "rotate(180deg)",
          marginBottom: "-20px",
          marginTop: "-50px",
          zIndex: 50,
          position: "relative",
        }}
      ></div>
      {/* Foto principal */}
      <div
        className="w-full max-w-2xl flex justify-center items-center p-0 my-0"
        style={{ lineHeight: 0 }}
      >
        <img
          src="/photos/357deab6-6a7e-47cf-be14-49c22392b2f6.png"
          alt="Foto principal"
          className="w-full object-cover block"
          style={{
            aspectRatio: "9/16",
            maxHeight: 1000,
            borderRadius: 0,
            boxShadow: "none",
            margin: 0,
            padding: 0,
          }}
        />
      </div>
      {/* Hoja rasgada abajo con efecto de máscara */}
      <div
        className="w-full h-[100px] select-none pointer-events-none block"
        style={{
          maskImage: `url('/hoja-rasgada.png')`,
          WebkitMaskImage: `url('/hoja-rasgada.png')`,
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center top",
          WebkitMaskPosition: "center top",
          backgroundImage: `url('/fondo.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          marginTop: "-50px",
          zIndex: 50,
          position: "relative",
        }}
      ></div>
    </section>
  );
};

export default InvitationSection2;
