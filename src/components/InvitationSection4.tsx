const InvitationSection4 = () => {
  return (
    <section className="relative w-full flex flex-col items-center justify-center bg-white overflow-hidden p-0 m-0 ">
      <div className="absolute -top-10 -left-25 w-60 h-60 md:w-80 md:h-80 transform rotate-90" style={{ zIndex: 60 }}>
        <img
          src="/flores.png"
          alt="Decorative flowers arrangement"
          loading="lazy"
          className="w-full h-full object-contain"
        />
      </div>
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
          marginBottom: "-90px",
          marginTop: "-50px",
          zIndex: 50,
          position: "relative",
        }}
      ></div>

      {/* Foto principal */}
      <div
        className="w-full max-w-2xl flex justify-center items-center p-0 m-0"
        style={{ lineHeight: 0 }}
      >
        <img
          src="/photos/3c430f49-09f4-4db1-b37d-3fcca9e001bc.png"
          alt="Main wedding photograph of the couple"
          loading="lazy"
          className="w-full object-cover block"
          style={{
            aspectRatio: "670/1000",
            maxHeight: 670,
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
          marginTop: "-30px",
          zIndex: 50,
          position: "relative",
        }}
      ></div>
      <div className="absolute -bottom-10 -right-20 w-60 h-60 md:w-80 md:h-80 transform rotate-360" style={{ zIndex: 60 }}>
        <img
          src="/flores.png"
          alt="Decorative flowers arrangement"
          loading="lazy"
          className="w-full h-full object-contain"
        />
      </div>
    </section>
  );
};

export default InvitationSection4;
