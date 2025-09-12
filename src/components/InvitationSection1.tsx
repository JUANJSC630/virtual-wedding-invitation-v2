import { motion } from "framer-motion";

const InvitationSection1 = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Imagen de fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/fondo.png')`,
        }}
      />
      {/* Flor en la esquina superior izquierda */}
      <div className="absolute -top-5 -left-10 w-72 h-72 md:w-80 md:h-80 opacity-80 transform rotate-180">
        <img
          src="/flor-esquina.png"
          alt="Flores decorativas"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Ramo en el centro derecho */}
      <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] opacity-60">
        <img
          src="/ramo.png"
          alt="Ramo de flores"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="max-w-sm mx-auto px-6 relative z-10">
        {/* Contenido principal */}
        <div className="pt-20 pb-12 text-center gap-8 flex flex-col items-center justify-center">
          {/* Cita bíblica elegante */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="text-xl font-serif text-gray-800 leading-relaxed italic mb-4">
              "El que encontró una esposa
              <br />
              encontró la felicidad; Yavé es
              <br />
              quien le otorgó ese favor."
            </p>
            <p className="text-sm text-gray-600 font-light">Proverbios 18:22</p>
          </motion.div>

          {/* Iniciales elegantes */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center justify-center gap-4">
              <motion.span
                className="text-8xl font-serif text-gray-800 font-bold"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                J
              </motion.span>
              <motion.div
                className="w-px h-16 bg-gray-400"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ duration: 0.4, delay: 0.8 }}
              ></motion.div>
              <motion.span
                className="text-8xl font-serif text-gray-800 font-bold"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                J
              </motion.span>
            </div>
          </motion.div>

          {/* Anuncio */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <p className="text-3xl font-medium text-gray-800 tracking-wider">
              ¡NOS CASAMOS!
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default InvitationSection1;
