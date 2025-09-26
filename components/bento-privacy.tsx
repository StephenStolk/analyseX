"use client"

import { ReactNode } from "react";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import {
  BellIcon,
  CalendarIcon,
  FileTextIcon,
  GlobeIcon,
  InputIcon,
} from "@radix-ui/react-icons";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

const BentoGrid = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-3 gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
}: {
  name: string;
  className?: string;
  background: ReactNode;
  Icon: React.ElementType;
  description: string;
  href: string;
  cta: string;
}) => (
  <motion.div
    key={name}
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, delay: 0.05 }}
    viewport={{ once: true }}
    whileHover={{ scale: 1.02 }}
    className={cn(
      "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl cursor-pointer",
      "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
      "transform-gpu dark:bg-black dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]",
      className
    )}
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {background}
    </motion.div>
    <motion.div
      className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-200 group-hover:-translate-y-10"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
        <Icon className="h-12 w-12 origin-left transform-gpu text-neutral-700 transition-all duration-200 ease-in-out group-hover:scale-75" />
      </motion.div>
      <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300">{name}</h3>
      <p className="max-w-lg text-neutral-400">{description}</p>
    </motion.div>

    <motion.div
      className="pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
      whileHover={{ x: 5 }}
      transition={{ duration: 0.15 }}
    >
      <Button variant="ghost" asChild size="sm" className="pointer-events-auto">
        <a href={href}>
          {cta}
          <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.15 }}>
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </motion.div>
        </a>
      </Button>
    </motion.div>
    <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-200 group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10" />
  </motion.div>
);

const features = [
  {
    Icon: FileTextIcon,
    name: "Finance Analyst",
    description: "Balance sheet creation for a SaaS company",
    href: "/",
    cta: "Try it out",
    background: (
      <div className="absolute inset-0 opacity-20">
        <svg className="absolute right-4 top-4 h-32 w-32 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
        </svg>
      </div>
    ),
    className: "lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3",
  },
  {
    Icon: InputIcon,
    name: "Marketing",
    description: "Acquisition channel efficiency analysis",
    href: "/",
    cta: "Try it out",
    background: (
      <div className="absolute inset-0 opacity-20">
        <svg className="absolute right-4 top-4 h-32 w-32 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
    ),
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3",
  },
  {
    Icon: GlobeIcon,
    name: "Operations",
    description: "Forecasting and inventory optimization",
    href: "/",
    cta: "Try it out",
    background: (
      <div className="absolute inset-0 opacity-20">
        <svg className="absolute right-4 top-4 h-32 w-32 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>
    ),
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4",
  },
  {
    Icon: CalendarIcon,
    name: "Business Owners",
    description: "Cash flow forecasting and budgeting",
    href: "/",
    cta: "Try it out",
    background: (
      <div className="absolute inset-0 opacity-20">
        <svg className="absolute right-4 top-4 h-32 w-32 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
      </div>
    ),
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2",
  },
  {
    Icon: BellIcon,
    name: "Data Science",
    description: "Data cleaning and preparation",
    href: "/",
    cta: "Try it out",
    background: (
      <div className="absolute inset-0 opacity-20">
        <svg className="absolute right-4 top-4 h-32 w-32 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
        </svg>
      </div>
    ),
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4",
  },
];

function BentoDemo() {
  return (
    <div className="py-24 bg-white dark:bg-background">
      <div className="container px-4 md:px-6 mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          viewport={{ once: true }}
          className="mb-16 text-left max-w-4xl"
        >
          <div className="relative">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "4rem" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="h-1 bg-black dark:bg-white rounded-full mb-6"
            />
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl font-serif font-normal leading-tight mb-4 text-foreground dark:text-white"
            >
              An AnalyzeX for
              <br />
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="font-serif font-semibold text-black dark:text-white"
              >
                every job
              </motion.span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="text-lg md:text-xl font-sans text-muted-foreground dark:text-gray-300 max-w-2xl leading-relaxed"
            >
              Powerful analytics solutions tailored for professionals across industries. 
              Transform your data into actionable insights.
            </motion.p>
          </div>
        </motion.div>

        {/* Bento Grid */}
        <BentoGrid className="lg:grid-rows-3">
          {features.map((feature) => {
            const childrenArray = React.Children.toArray(
              feature.background.props.children
            );

            return (
              <BentoCard
                key={feature.name}
                {...feature}
                background={
                  <div className="absolute inset-0 opacity-10">
                    {childrenArray.map((child: any) =>
                      React.cloneElement(child, {
                        className: `${child.props.className?.replace(
                          /text-(\w+)-\d+/,
                          "text-black dark:text-white"
                        )}`,
                      })
                    )}
                  </div>
                }
                className={cn(
                  feature.className,
                  "bg-white dark:bg-black border border-muted/20 dark:border-white/10 shadow-sm hover:shadow-md"
                )}
              />
            );
          })}
        </BentoGrid>
      </div>
    </div>
  );
}

export default BentoDemo;
