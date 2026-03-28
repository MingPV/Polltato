import { useState } from 'react';

import { Head } from '@/components/seo';
import { Button } from '@/components/ui/button';

const createOptionId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const PollCreateRoute = () => {
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(() => [
    { id: createOptionId(), value: '' },
    { id: createOptionId(), value: '' },
  ]);

  const handleOptionChange = (id: string, value: string) => {
    setOptions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, value } : item)),
    );
  };

  const handleAddOption = () => {
    setOptions((prev) => [...prev, { id: createOptionId(), value: '' }]);
  };

  return (
    <>
      <Head description="Create a new poll and share by link or QR." />
      <div className="relative min-h-screen overflow-hidden bg-[#f5efe4] px-6 py-10 lg:px-12">
        <div className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full bg-[#ecd8c1]/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 size-64 rounded-full bg-[#ddb38b]/35 blur-3xl" />

        <div className="mx-auto w-full max-w-3xl">
          <h1 className="mt-[10vh] font-serif text-5xl font-semibold leading-tight text-[#2f1c12] sm:text-6xl">
            Create your own poll.
          </h1>
          <p className="mt-3 text-lg text-[#6b4d3a]">
            Just type, publish, and share by link or QR code.
          </p>

          <div className="mt-8 space-y-4 rounded-[2rem] bg-white/75 p-5 shadow-[0_16px_45px_rgba(93,52,23,0.15)] sm:p-7">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#5c3f2d]">
                Poll title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What should we eat this Friday?"
                className="w-full rounded-2xl border border-[#dec4aa] bg-[#fff9f0] px-4 py-3 text-[#3f2a1e] outline-none placeholder:text-[#9e7c65] focus:border-[#b27c55]"
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-[#5c3f2d]">Options</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {options.map((option, index) => (
                  <input
                    key={option.id}
                    value={option.value}
                    onChange={(e) =>
                      handleOptionChange(option.id, e.target.value)
                    }
                    placeholder={`Option ${index + 1}`}
                    className="rounded-2xl border border-[#dec4aa] bg-[#fff9f0] px-4 py-3 text-[#3f2a1e] outline-none placeholder:text-[#9e7c65] focus:border-[#b27c55]"
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddOption}
              className="rounded-full bg-[#f9ebda] px-4 py-2 text-sm font-medium text-[#7b5134] transition hover:bg-[#f5e1cc]"
            >
              + Add one more option
            </button>

            <div className="mt-4 flex justify-center pt-2 sm:justify-end">
              <Button className="rounded-full bg-[#6f3f23] px-12 py-6 text-lg font-bold text-white hover:bg-[#5d331c]">
                Create Poll
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PollCreateRoute;
