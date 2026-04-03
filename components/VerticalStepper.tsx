import config from "../config/steps.json";

export default function VerticalStepper() {
  const { steps } = config;

  return (
    <div className="mt-16 space-y-12 relative">
      <div className="absolute left-7 top-[3rem] bottom-0 w-1 bg-[#F0E7E5]"></div>

      {steps.map((step) => (
        <div key={step.number} className="relative flex items-start gap-6">
          <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-[#D15949] text-white text-2xl font-bold shadow-md shrink-0">
            {step.number}
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-[#F0E7E5] w-full">
            <h3 className="text-xl font-bold text-[#1C2A39] mb-2">{step.title}</h3>
            <p className="text-[#1C2A39] leading-relaxed mb-3">{step.text}</p>
            {step.bullets && (
              <ul className="list-disc ml-6 space-y-1 text-[#1C2A39] mb-3">
                {step.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
            {step.links && (
              <div className="flex flex-wrap gap-3 mt-3">
                {step.links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-[#D15949] hover:bg-[#B84A3C] text-white text-sm font-medium px-5 py-2 rounded transition-colors duration-150"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
