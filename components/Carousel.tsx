import { Autoplay } from "swiper"
import { Swiper, SwiperSlide } from "swiper/react"

interface Props {
  items: React.ReactChild[];
}

export default function Carousel({ items }: Props) {
  return (<Swiper
    style={{ height: "100%" }}
    modules={[Autoplay]}
    spaceBetween="40"
    grabCursor={true}
    loop={true}
    breakpoints={{
      768: {
        width: 768,
        slidesPerView: 2,
      },
      1024: {
        width: 1024,
        slidesPerView: 4
      }
    }}
    autoplay={{
      delay: 1500,
      pauseOnMouseEnter: true,
      stopOnLastSlide: false
    }}>
    {items.map((item, i) => (<SwiperSlide
      style={{ textAlign: "center" }}
      key={i}>
      {item}
    </SwiperSlide>))}
  </Swiper>)
}
