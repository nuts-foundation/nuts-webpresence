import { Autoplay } from "swiper"
import { Swiper, SwiperSlide } from "swiper/react"

interface Props {
  items: React.ReactChild[];
}

export default function Carousel({ items }: Props) {
  return (<Swiper
    style={{ height: "100%" }}
    modules={[Autoplay]}
    loop={true}
    grabCursor={true}
    centeredSlides={true}
    breakpoints={{
      100: {
        slidesPerView: 1,
      },
      768: {
        slidesPerView: 2,
      },
      1024: {
        spaceBetween: 40,
        slidesPerView: 4,
      },
      1920: {
        spaceBetween: 50,
        slidesPerView: 5
      }
    }}
    autoplay={{
      delay: 1500,
      pauseOnMouseEnter: true,
      stopOnLastSlide: false
    }}>
    {items.map((item, i) => (<SwiperSlide
      style={{ textAlign: "center" }}
      key={i}>{item}</SwiperSlide>))}
  </Swiper>)
}
