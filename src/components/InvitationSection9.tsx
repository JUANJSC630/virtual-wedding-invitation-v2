import { useAssets } from "@/context/AssetContext";
import { useEventContext } from "@/context/EventContext";

const InvitationSection9 = () => {
  const { event } = useEventContext();
  const assets = useAssets();
  const heroPhotoUrl = event?.heroPhotoUrl ?? "/photos/IMG_2041.jpeg";

  return (
    <section className="relative w-full flex flex-col items-center justify-center bg-white overflow-hidden p-0 m-0 ">
      {/* Hoja rasgada arriba */}
      <div
        className="w-full h-[100px] select-none pointer-events-none block"
        style={{
          maskImage: `url('${assets.tornPaper}')`,
          WebkitMaskImage: `url('${assets.tornPaper}')`,
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center bottom",
          WebkitMaskPosition: "center bottom",
          backgroundImage: `url('${assets.background}')`,
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
          src={heroPhotoUrl}
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
          maskImage: `url('${assets.tornPaper}')`,
          WebkitMaskImage: `url('${assets.tornPaper}')`,
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center top",
          WebkitMaskPosition: "center top",
          backgroundImage: `url('${assets.background}')`,
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

export default InvitationSection9;
