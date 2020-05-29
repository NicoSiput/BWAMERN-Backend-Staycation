const Item = require("../models/Item");
const Treasure = require("../models/Activity");
const Treveler = require("../models/Booking");
const Category = require("../models/Category");
const Bank = require("../models/Bank");
const Member = require("../models/Member");
const Booking = require("../models/Booking");

module.exports = {
  landingPage: async (req, res) => {
    try {
      const mostPicked = await Item.find()
        .select("_id title country city price unit imageId")
        .limit(5)
        .populate({ path: "imageId", select: "_id imageUrl" });

      const treveler = await Treveler.find();
      const treasure = await Treasure.find();
      const city = await Item.find();
      const category = await Category.find()
        .select("_id name")
        .limit(3)
        .populate({
          path: "itemId",
          perDocumentLimit: 4,
          option: { sort: { sumBooking: -1 } },
          populate: {
            path: "imageId",
            select: "_id imageUrl",
            perDocumentLimit: 1,
          },
          select: "_id title country city isPopular unit imageId",
        });

      for (let i = 0; i < category.length; i++) {
        for (let x = 0; x < category[i].itemId.length; x++) {
          const item = await Item.findOne({ _id: category[i].itemId[x]._id });
          item.isPopular = false;
          await item.save();
          if (category[i].itemId[0] === category[i].itemId[x]) {
            item.isPopular = true;
            await item.save();
          }
        }
      }

      const testimonial = {
        _id: "asd1293uasdads1",
        imageUrl: "/images/testimonial-landingpages.jpg",
        name: "Happy Family",
        rate: 4.55,
        content:
          "What a great trip with my family and I should try again next time soon ...",
        familyName: "Angga",
        familyOccupation: "Product Designer",
      };

      res.status(200).json({
        hero: {
          trevelers: treveler.length,
          treasures: treasure.length,
          cities: city.length,
        },
        mostPicked,
        category,
        testimonial,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  detailPage: async (req, res) => {
    try {
      const { id } = req.params;
      const item = await Item.findOne({ _id: id })
        .populate({ path: "featureId", select: "_id imageUrl qty name" })
        .populate({ path: "activityId", select: "_id imageUrl type name" })

        .populate({ path: "imageId", select: "_id imageUrl" });

      const bank = await Bank.find();
      const testimonial = {
        _id: "asd1293uasdads1",
        imageUrl: "/images/testimonial-landingpages.jpg",
        name: "Happy Family",
        rate: 4.55,
        content:
          "What a great trip with my family and I should try again next time soon ...",
        familyName: "Angga",
        familyOccupation: "Product Designer",
      };

      res.status(200).json({
        ...item._doc,
        bank,
        testimonial,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  bookingPage: async (req, res) => {
    const {
      idItem,
      duration,
      price,
      bookingStartDate,
      bookingEndDate,
      firstName,
      lastName,
      emailAddress,
      phoneNumber,
      accountHolder,
      bankFrom,
    } = req.body;

    if (!req.file) {
      return res.status(404).json({ message: "Image Not Found" });
    }

    if (
      duration === "" ||
      idItem === "" ||
      price === "" ||
      bookingStartDate === "" ||
      bookingEndDate === "" ||
      firstName === "" ||
      lastName === "" ||
      emailAddress === "" ||
      phoneNumber === "" ||
      accountHolder === "" ||
      bankFrom === "" ||
      duration === undefined ||
      idItem === undefined ||
      price === undefined ||
      bookingStartDate === undefined ||
      bookingEndDate === undefined ||
      firstName === undefined ||
      lastName === undefined ||
      emailAddress === undefined ||
      phoneNumber === undefined ||
      accountHolder === undefined ||
      bankFrom === undefined
    ) {
      res.status(404).json({ message: "Field Tidak Lengkap" });
    }

    const item = await Item.findOne({ _id: idItem }, (err, a) => {
      if (err) {
        return res.status(404).json({ message: err.message });
      }
    });

    if (!item) {
      return res.status(404).json({ message: "Item Not Found !" });
    }
    item.sumBooking += 1;
    await item.save();

    let total = item.price * duration;
    let tax = total * 0.1;

    const invoice = Math.floor(1000000 + Math.random() * 9000000);

    const member = await Member.create({
      firstName,
      lastName,
      email: emailAddress,
      phoneNumber,
    });

    const newBooking = {
      invoice,
      bookingStartDate,
      bookingEndDate,
      total: (total += tax),
      itemId: {
        _id: item.id,
        title: item.title,
        price: item.price,
        duration,
      },
      memberId: member.id,
      payments: {
        proofPayment: `images/${req.file.filename}`,
        bankFrom,
        accountHolder,
      },
    };

    const booking = await Booking.create(newBooking);

    res.status(201).json({ message: "Success Booking", booking });
  },
};
