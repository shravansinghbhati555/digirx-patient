import { PageHeader, Screen } from '../../components/ui/Layout';

/** Placeholder until legal provides the final copy. */
export function Legal() {
  return (
    <div className="min-h-dvh bg-screen">
      <Screen>
        <PageHeader title="Terms & privacy" back="/login" />
        <h1 className="h1 mt-6">Terms of service</h1>
        <p className="m-0 mt-3 text-[15px] leading-[1.55] text-text-body">[Terms of service — final text to be provided by DigiRx legal]</p>
        <h2 className="h2-lg mt-8">Privacy policy</h2>
        <p className="m-0 mt-3 text-[15px] leading-[1.55] text-text-body">[Privacy policy — final text to be provided by DigiRx legal]</p>
      </Screen>
    </div>
  );
}
