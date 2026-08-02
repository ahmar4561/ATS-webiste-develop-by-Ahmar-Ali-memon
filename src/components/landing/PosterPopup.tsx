"use client";

import { useState, useEffect } from "react";
import { X, Download, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/Button";

const POSTER_IMAGE = "/ats-physical-test-poster.png";
const POSTER_PDF = "/ats-physical-test-poster.pdf";

export function PosterPopup() {
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Show the poster popup once per browser, after a short delay
    const alreadySeen = sessionStorage.getItem("ats_poster_seen");
    if (alreadySeen) return;

    const timer = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem("ats_poster_seen", "1");
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 250);
  };

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-sm transition-opacity duration-250 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transition-all duration-250 ${
          closing ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-navy-900" />
        </button>

        <div className="max-h-[70vh] overflow-y-auto bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={POSTER_IMAGE}
            alt="ATS Physical Test Poster — Entry Test Mock Series 2026"
            className="w-full h-auto cursor-zoom-in"
            onClick={() => setZoomed(true)}
          />
        </div>

        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setZoomed(true)}
          >
            <ZoomIn className="w-4 h-4" />
            View Full Size
          </Button>
          <a href={POSTER_PDF} download="ATS-Physical-Test-Poster.pdf" className="flex-1">
            <Button className="w-full">
              <Download className="w-4 h-4" />
              Download Poster
            </Button>
          </a>
        </div>
      </div>

      {/* Full-size zoom overlay */}
      {zoomed && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-2 bg-black/90"
          onClick={(e) => {
            e.stopPropagation();
            setZoomed(false);
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setZoomed(false);
            }}
            aria-label="Close zoomed view"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center"
          >
            <X className="w-5 h-5 text-navy-900" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={POSTER_IMAGE}
            alt="ATS Physical Test Poster — full size"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
