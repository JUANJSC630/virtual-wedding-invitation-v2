import React from "react";

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
          src="/photos/d9c19fc8b37260cc75cb82e4e706e0b1.jpg"
          alt="Foto principal"
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
    </section>
  );
};

export default InvitationSection2;
