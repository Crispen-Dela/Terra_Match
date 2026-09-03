import { Link } from "react-router-dom";
import Button from "../common/Button";
import { unsplashUrl, CONTRACTOR_PHOTO_IDS } from "../../constants/stockImages";

export default function CustomProjectBanner() {
  return (
    <section className="container-page py-10 sm:py-14">
      <div className="relative overflow-hidden rounded-2xl bg-forest-900 shadow-card">
        <div className="relative z-10 max-w-md p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Need a Custom Project?
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-white/85">
            Talk to TerraBot AI about your project goals and get matched with top verified contractors.
          </p>
          <Button
            as={Link}
            to="/ai"
            variant="primary"
            size="md"
            className="mt-6"
          >
            Talk to AI Assistant
          </Button>
        </div>

        <div className="absolute inset-y-0 right-0 hidden w-1/2 overflow-hidden sm:block">
          <img
            src={unsplashUrl(CONTRACTOR_PHOTO_IDS.modernInterior, { w: 1000 })}
            alt="Modern construction architecture"
            className="h-full w-full object-cover opacity-60"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-900 via-forest-900/40 to-transparent" />
        </div>
      </div>
    </section>
  );
}
